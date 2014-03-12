/* Demons should remain as de-coupled as practical.
   They will only communicate with the main app server via the API,
   not internal methods, despite that being fundamentally easier. */
var Querystring = require('querystring');
var Fs = require('fs');
var Util = require('util');
var Path = require('path');
var Hapi = require('hapi');
var Utils = Hapi.utils;

var Nipple = require('nipple');
var Async = require('async');
var Kue = require('kue'),
    Job = Kue.Job;

var internals = {};

internals.DemonMaster = function (options) {

    options = options || {};

    this._settings = {};

    if (options.requirePath) {

        this._settings.requirePath = Path.resolve(options.requirePath);
    }

    this._settings.packs = options.packs || {};

    // Important paths
    this._settings.appRoot = options.appRoot || '';
    this._settings.packsPath = options.packsPath || '';
    this._settings.contentPath = options.contentPath || '';

    Utils.assert(options.queue, 'No queue settings defined!');

    if (options.queue.kue) {

        this.queue = this.usingKue(options.kue);
    }

    this.hapi = Hapi;
    this.config = options.config;

    this._hooks = {};

    if (options.hooks) {

        // Pre-populate the hooks that will need processing
        for (var hook in options.hooks) {
            this._hooks[hook] = [];
        }
    }

    this._registered = {};
};

internals.DemonMaster.prototype.usingKue = function (settings) {

    var defaults = {
        disableSearch: true
    };

    var config = Utils.applyToDefaults(defaults, settings);

    return Kue.createQueue(config);
};

internals.DemonMaster.prototype.init = function (callback) {

    var self = this;
    var settings = this._settings;

    this.require(settings.packs, {}, function (err) {
        self._processHandlers();
        callback(err);
    });
};

internals.DemonMaster.prototype._processCleanUp = function (endpoint) {

    if (!endpoint) {

        // Without an endpoint, we can't cleanup,
        // so just let things finish
        return;
    }

    Nipple.put(endpoint + '?clearQueue=true', noop);
};

internals.DemonMaster.prototype._jobDone = function (id) {

    var self = this;

    Job.get(id, function (err, job) {
        if (err) return;

        if (job.data && job.data.cleanup) {

            // Cleanup requested
            self._processCleanUp(job.data.endpoint);
            return;
        }
    });
};

internals.DemonMaster.prototype._processHandlers = function () {

    var self = this;

    var queue = this.queue;
    var hooks = this._hooks;

    queue.on('job complete', function (id) {
        self._jobDone(id);
    });

    queue.on('job failed', function (id) {
        self._jobDone(id);
    });

    // Iterate hooks, to set up queue processes to handle
    var attachHandlers = function () {

        for (var hook in hooks) {

            // Listen to the job queue
            queue.process(hook, processHandler);
        }
    };

    var processHandler = function (job, done) {

        // Get the processes array,
        // for the async series
        var processes = hooks[job.type],
            pending = processes.length,
            total = pending;

        if (total === 0) {

            // No processes for this hook,
            // so clear it and callback
            if (job.data && job.data.cleanup) {

                // Cleanup requested

                // TODO: Should process wait on cleanup response??

                self._processCleanUp(job.data.endpoint);
            }

            return done();
        }

        // Setup the series of processes that will be run
        Async.eachSeries(processes, function (proc, next) {

                // Decrement pending for each process,
                // progress becomes a percent of processes complete.
                --pending;

                // Pass in the job
                proc.fn(job, function (err) {
                    job.progress(total - pending, total);
                    next(err);
                });
            },
            function (err) {

                if (err) {
                    job.error(err);
                }

                done(err);
            });
    };

    attachHandlers();
};

internals.DemonMaster.prototype._process = function ( /* hook, fn, options | {} | [{}, {}] */ ) {

    var procItem = {};

    if (typeof arguments[0] === 'string') {
        procItem = {
            hook: arguments[0],
            fn: arguments[1],
            options: arguments[2]
        };
    } else {
        procItem = arguments[0];
    }

    var items = [].concat(procItem);

    for (var i = 0, il = items.length; i < il; ++i) {
        var item = items[i];
        this._addProcessHandler(item.hook, item.fn, item.options);
    }
};

/*
    Building a _hooks object that looks like this:
    this._hooks = {
        'post.created': [
            { fn: handler(), priority: 0 },
            { fn: handler(), priority: 0 }
        ]
    }
*/
internals.DemonMaster.prototype._addProcessHandler = function (hook, fn, options) {

    this._hooks[hook] = this._hooks[hook] || [];

    // processes with no priority are put at the end
    this._hooks[hook].push({
        fn: fn,
        priority: options.hasOwnProperty('priority') ? options.priority : 99
    });
};

internals.DemonMaster.prototype._sortProcessHandlers = function (hook, fn, options) {

    var hooks = this._hooks;

    var prioritySort = function (a, b) {
        if (a.priority > b.priority) {
            return 1;
        }
        if (a.priority < b.priority) {
            return -1;
        }

        return 0;
    };

    Object.keys(hooks).forEach(function (hookName) {
        hooks[hookName].sort(prioritySort);
    });
};

internals.DemonMaster.prototype._register = function (demon, options, done) {

    var self = this;
    var registered = this._registered;

    // Setup root demon object
    var root = {};

    root.hapi = this.hapi;
    root.config = this.config;
    root.queue = this.queue;
    root.hooks = this._hooks;
    root.registered = registered;

    root.process = function ( /* hooks, fn, options */ ) {

        return self._process.apply(self, arguments);
    };

    demon.register.call(null, root, options || {}, function (err) {

        if (!err) {
            registered[demon.name] = true;
        }

        done();
    });
};

internals.DemonMaster.prototype.require = function (names, options, callback) {

    var self = this;

    this._require(names, options, function (err) {
        self._sortProcessHandlers();
        callback(err);
    });
};

internals.DemonMaster.prototype._require = function (names, options, callback, requireFunc) {

    var self = this;
    var settings = this._settings;
    var registered = this._registered;

    requireFunc = requireFunc || require;

    var parse = function () {

        var registrations = [];

        Object.keys(names).forEach(function (item) {

            registrations.push({
                name: item,
                options: names[item] || {},
                disabled: !Boolean(names[item])
            });
        });

        Async.eachSeries(registrations, function (item, next) {

                // Set the registered flag to false,
                // reset as true when ready.
                registered[item.name] = false;

                if (item.disabled) {

                    // Support explicit disabling of packs
                    return next();
                }

                load(item, next);
            },
            function (err) {

                return callback(err);
            });
    };

    var load = function (item, next) {

        var itemName = item.name;

        var contentPath = settings.contentPath;

        self.demonHunter(itemName, function (err, demonPath) {

            if (err) return next();

            var demonContentPath = Path.join(contentPath, 'packs', itemName);

            var mod = requireFunc(demonPath);

            // Packs can sometimes combine a standard HAPI pack with
            // a demon, in which case, it would export a `demon` property
            var demon = mod.demon || mod;

            if (!demon) {

                // Plugins can export plugins or demons,
                // in this case we only care about demons
                return next();
            }

            internals.DemonMasterHunterPath(demonContentPath, function (err, demonContent) {

                var packageFile = Path.join(demonPath, 'package.json');
                var pkg = requireFunc(packageFile);

                var processor = {
                    name: pkg.name,
                    version: pkg.version,
                    register: demon.register,
                    path: internals.packagePath(pkg.name, packageFile)
                };

                if (demonContent) {
                    item.options.contentPath = item.options.contentPath || demonContent;
                }

                self._register(processor, item.options, next);
            });
        });
    };

    parse();
};

// 1. [appRoot]/node_modules/[demonName]
// 2. [appRoot]/[contentPath]/packs/[demonName]
// 3. ./demons

internals.DemonMaster.prototype.demonHunter = function (name, done) {

    var settings = this._settings;

    var appRoot = settings.appRoot;
    var packsPath = settings.packsPath;

    var testPaths = [];

    testPaths.push(Path.join(appRoot, 'node_modules', name));
    testPaths.push(Path.join(packsPath, name));
    testPaths.push(Path.join(__dirname, '../demons', name));

    internals.DemonMasterHunterPath(testPaths, done);
};

internals.DemonMasterHunterPath = function (paths, done) {

    var testPath, manyPaths;

    if (paths instanceof Array && paths.length) {

        manyPaths = true;
        testPath = paths.shift();

    } else {

        testPath = paths;
    }

    Fs.stat(testPath, function (err, stats) {

        if (stats && stats.isDirectory()) {

            return done(null, testPath);

        } else if (manyPaths && paths.length) {

            internals.DemonMasterHunterPath(paths, done);

        } else {

            done(err);
        }
    });
};

internals.packagePath = function (name, packageFile) {

    var pkgPath = null;

    var keys = Object.keys(require.cache);
    for (var i = 0, il = keys.length; i < il; ++i) {
        var key = keys[i];
        if (key.indexOf(packageFile) === key.length - packageFile.length) {
            var record = require.cache[key];
            if (record.exports &&
                record.exports.name === name) {

                pkgPath = Path.dirname(key);
                break;
            }
        }
    }

    return pkgPath;
};

function noop() {};

module.exports = internals.DemonMaster;

/* Demons should remain as de-coupled as practical.
   They will only communicate with the main app server via the API,
   not internal methods, despite that being fundamentally easier. */

var Util = require('util');
var Path = require('path');
var Hapi = require('hapi');
var Utils = Hapi.utils;

var Request = require('request');
var Async = require('async');
var Kue = require('kue');

var Config = require('../server/config');

var internals = {};

internals.Demon = function (options) {

    options = options || {};

    this._settings = {};

    if (options.requirePath) {

        this._settings.requirePath = Path.resolve(options.requirePath);
    }

    Utils.assert(options.queue, 'No queue settings defined!');

    if (options.queue.kue) {

        this.queue = this.usingKue(options.kue);
    }

    this._hooks = {};
};

internals.Demon.prototype.usingKue = function (settings) {

    var defaults = {
        disableSearch: true
    };

    var config = Utils.applyToDefaults(defaults, settings);

    return Kue.createQueue(config);
};

internals.Demon.prototype.init = function (callback) {

    var self = this;

    var demons = Config().demons || [];

    this.require(demons, {}, function (err) {
        self._processHandlers();
        callback(err);
    });
};

internals.Demon.prototype._processHandlers = function () {

    var self = this;

    var queue = this.queue;
    var hooks = this._hooks;

    var processes = {};

    // Iterate hooks, to set up queue processes to handle
    var attachHandlers = function () {

        for (var hook in hooks) {

            // Get the processes array, for the async series
            processes = hooks[hook] || [];

            // Listen to the job queue
            queue.process(hook, processHandler);
        }
    };

    var processHandler = function (job, done) {

        var pending = processes.length,
            total = pending;

        // Setup the series of processes that will be run
        Async.forEachSeries(processes, function (proc, next) {

                --pending;

                // Pass in the job
                proc.fn(job, function (err) {
                    job.progress(total - pending, total);
                    next(err);
                });
            },
            function (err) {

                if (job.data && job.data.cleanup) {

                    console.log('job done, cleaning up');

                    Request.put({
                        url: job.data.endpoint,
                        qs: {
                            'clear-queue': true,
                            'job-id': job.id
                        }
                    }, function (err, response, body) {

                        console.log('cleanup response');
                        done(err);
                    });

                } else {

                    // Complete the job
                    return done(err);
                }
            });
    };

    attachHandlers();
};

internals.Demon.prototype._process = function ( /* hook, fn, options | {} | [{}, {}] */ ) {

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
internals.Demon.prototype._addProcessHandler = function (hook, fn, options) {

    this._hooks[hook] = this._hooks[hook] || [];

    // processes with no priority are put at the end
    this._hooks[hook].push({
        fn: fn,
        priority: options.hasOwnProperty('priority') ? options.priority : 99
    });
};

internals.Demon.prototype._sortProcessHandlers = function (hook, fn, options) {

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

internals.Demon.prototype._register = function (plugin, options, callback) {

    var self = this;

    // Setup root demon object
    var root = {};

    root.config = Config;
    root.queue = this.queue;
    root.hooks = this._hooks;

    root.process = function ( /* hooks, fn, options */ ) {

        return self._process.apply(self, arguments);
    };

    plugin.register.call(null, root, options || {}, function (err) {

        callback(err);
    });
};

internals.Demon.prototype.require = function (names, options, callback) {

    var self = this;

    this._require(names, options, function (err) {
        self._sortProcessHandlers();
        callback(err);
    });
};

internals.Demon.prototype._require = function (names, options, callback, requireFunc) {

    var self = this;

    requireFunc = requireFunc || require;

    var parse = function () {

        var registrations = [];

        names.forEach(function (item) {

            registrations.push({
                name: item,
                options: null
            });
        });

        Async.forEachSeries(registrations, function (item, next) {

                load(item, next);
            },
            function (err) {

                return callback(err);
            });
    };

    var load = function (item, next) {

        var itemName = item.name;
        if (itemName[0] === '.') {
            itemName = Path.join(__dirname, itemName);
        } else if (itemName[0] !== '/' &&
            self._settings.requirePath) {

            itemName = Path.join(self._settings.requirePath, itemName);
        }

        var packageFile = Path.join(itemName, 'package.json');

        var mod = requireFunc(itemName);
        var pkg = requireFunc(packageFile);

        var processor = {
            name: pkg.name,
            version: pkg.version,
            register: mod.register,
            path: internals.packagePath(pkg.name, packageFile)
        };

        self._register(processor, item.options, next);
    };

    parse();
};

internals.Demon.start = function () {

    var config = {
        requirePath: Path.resolve(__dirname),
        queue: Config().queue
    };

    var demon = new internals.Demon(config);

    demon.init(function () {
        console.info('😈  Snack Demon ready!');
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

module.exports = internals.Demon.start;

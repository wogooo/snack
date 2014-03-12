/* jshint expr: true */

var Domain = require('domain'),
    Kue = require('kue'),
    Job = Kue.Job;

var defaults = {
    namespace: 'queue',
    attempts: 3,
    basePath: '',
    kue: {
        disableSearch: true,
        redis: {
            host: 'localhost',
            port: 6379
        }
    }
};

var internals = {};

internals.SnackQueue = function (plugin, options) {

    options = options || {};

    var Hapi = plugin.hapi;
    var Utils = Hapi.utils;

    Utils.assert(options.kue, 'No configuration provided for Kue!');

    this._settings = Utils.applyToDefaults(defaults, options);

    this.plugin = plugin;
    this.hapi = Hapi;

    this.queue = {};
    this.socketIO = this.loadSocketIO();
};

internals.SnackQueue.prototype.start = function (next) {

    var self = this;
    var settings = this._settings;

    this.queue = Kue.createQueue(settings.kue);
    this.queue.client.on('ready', next);
};

internals.SnackQueue.prototype.loadSocketIO = function () {

    var plugin = this.plugin;
    var SocketIO;

    // If a server got labeled for socket.io, and if it exists
    // at an expected location, use the server instance.

    // TODO: We only want to do this once for a certain server. Uncertain
    // of what the conventions for this might be...

    var selection = plugin.select('socket.io');

    selection.servers.forEach(function (server) {

        if (SocketIO) {
            return;
        }

        if (server.app.services && (server.app['socket.io'] || server.app.services['socket.io'])) {

            // Check for two possible locations, `services` is pretty
            // specific to the Snack organization.
            SocketIO = server.app['socket.io'] || server.app.services['socket.io'];
        }
    });

    return SocketIO;
};

internals.SnackQueue.prototype.createJob = function (task, done) {

    var settings = this._settings;
    var basePath = settings.basePath;

    if (!task.type) {
        return done(new Error('Must provide job type'));
    }

    var job = new Job(task.type, task.data || {});

    var options = task.options || {};

    if (settings.attempts) {
        job.attempts(+settings.attempts);
    }

    if (task.priority) {
        job.priority(+task.priority);
    }

    if (task.delay) {

        // If we actually want a delay
        job.delay(+task.delay);
        this.queue.promote();

    } else {

        // Default is to delay for explicit later start
        job._state = 'delayed';
    }

    job.save(function (err) {
        if (err) {
            return done(err);
        }

        done(null, {
            message: 'job created',
            id: job.id
        });
    });
};

/*
    Allows separation of job creation and execution.
    eg, A database record can be updated with queue
    data before processing starts
*/

internals.SnackQueue.prototype.startJob = function (j, done) {

    done = done || function () {};

    Job.get(j.id, function (err, job) {
        if (err) return done(err);

        job.inactive(function (err) {
            if (err) return done(err);

            done(null, {
                message: 'job started',
                id: job.id
            });
        });
    });
};

internals.SnackQueue.prototype.removeJob = function (job, done) {

    Job.remove(job.id, function (err) {
        if (err) {
            return done(err);
        }

        done(null, {
            message: 'job ' + job.id + ' removed'
        });
    });
};

internals.SnackQueue.prototype.getJob = function (j, done) {

    Job.get(j.id, function (err, job) {

        if (err) {
            return done(err);
        }

        done(null, job);
    });
};

internals.SnackQueue.prototype.getJobLog = function (job, done) {

    Job.log(job.id, function (err, log) {

        if (err) {
            return done(err);
        }

        done(null, log);
    });
};

internals.SnackQueue.prototype.getJobRange = function (options, cb) {

    options = options || {};

    var state = options.state || null;
    var type = options.type || null;
    var order = options.order || 'desc';

    options.offset = +options.offset || 0;
    var from = options.offset;

    options.limit = +options.limit || 10;
    var to = from + (options.limit - 1);

    var validStates = {
        'active': true,
        'inactive': true,
        'failed': true,
        'complete': true
    };

    function done(err, results) {

        if (err) return cb(err);

        var list = internals.formatList(results, options);

        cb(null, list);
    }

    if (validStates[state]) {

        if (type) {

            Job.rangeByType(type, state, from, to, order, done);

        } else {

            Job.rangeByState(state, from, to, order, done);
        }

    } else {

        Job.range(from, to, order, done);
    }
};

internals.SnackQueue.prototype.stats = function (done) {

    var queue = this.queue;

    internals.get(queue)
    ('inactiveCount')
    ('completeCount')
    ('activeCount')
    ('failedCount')
    ('delayedCount')
    ('workTime')
    (function (err, obj) {
        if (err) {
            return done(err);
        }

        done(null, obj);
    });
};

internals.SnackQueue.prototype.registerMethods = function () {

    var sq = this;
    var plugin = this.plugin;
    var settings = this._settings;

    plugin.method({
        name: settings.namespace,
        fn: function (method, obj, next) {
            sq[method](obj, next);
        }
    });
};

internals.SnackQueue.prototype.registerRoutes = function () {

    var sq = this;

    var Hapi = this.hapi;
    var plugin = this.plugin;
    var settings = this._settings;
    var basePath = settings.basePath;

    plugin.route({
        method: 'GET',
        path: basePath + '/jobs/stats',
        handler: function (request, reply) {
            sq.stats(function (err, result) {
                if (err) {
                    return reply({
                        error: err.name,
                        message: err.message
                    }).code(500);
                }

                reply(result);
            });
        }
    });

    plugin.route({
        method: 'GET',
        path: basePath + '/jobs/{id}',
        config: {
            validate: {
                path: {
                    id: Hapi.types.number().min(1)
                }
            },
            handler: function (request, reply) {

                sq.getJob(request.params, function (err, result) {

                    if (err) {
                        return reply({
                            error: err.name,
                            message: err.message
                        }).code(500);
                    }

                    reply(result);
                });
            }
        }
    });

    plugin.route({
        method: 'GET',
        path: basePath + '/jobs/{id}/log',
        config: {
            validate: {
                path: {
                    id: Hapi.types.number().min(1)
                }
            },
            handler: function (request, reply) {

                sq.getJobLog(request.params, function (err, result) {

                    if (err) {
                        return reply({
                            error: err.name,
                            message: err.message
                        }).code(500);
                    }

                    reply(result);
                });
            }
        }
    });

    plugin.route({
        method: 'GET',
        path: basePath + '/jobs',
        handler: function (request, reply) {

            sq.getJobRange(request.query, function (err, result) {
                if (err) {
                    return reply({
                        error: err.name,
                        message: err.message
                    }).code(500);
                }

                reply(result);
            });
        }
    });

    plugin.route({
        method: 'DELETE',
        path: basePath + '/jobs/{id}',
        config: {
            validate: {
                path: {
                    id: Hapi.types.number().min(1)
                }
            },
            handler: function (request, reply) {

                plugin.methods.sqRemoveJob(request.params, function (err, result) {

                    if (err) {
                        return reply({
                            error: err.name,
                            message: err.message
                        }).code(500);
                    }

                    reply(result);
                });
            }
        }
    });

    plugin.route({
        method: 'POST',
        path: basePath + '/jobs',
        handler: function (request, reply) {

            var payload = request.payload || {};

            sq.createJob(payload, function (err, result) {
                if (err) {
                    return reply({
                        error: err.name,
                        message: err.message
                    }).code(500);
                }

                reply(result);
            });
        }
    });
};

/**
 * Data fetching helper.
 */

internals.get = function (obj) {
    var pending = 0,
        res = {}, callback, done;

    return function _(arg) {
        switch (typeof arg) {
        case 'function':
            callback = arg;
            break;
        case 'string':
            ++pending;
            obj[arg](function (err, val) {
                if (done) return;
                if (err) return done = true, callback(err);
                res[arg] = val;
                --pending || callback(null, res);
            });
            break;
        }
        return _;
    };
};

/**
 * Format list output
 */
internals.formatList = function (jobs, options) {

    var items = [],
        item;

    jobs.forEach(function (job) {
        item = job.toJSON();
        items.push(item);
    });

    var list = {
        type: 'jobList',
        order: options.order || 'desc',
        offset: options.offset || 0,
        limit: options.limit || 10,
        count: items.length,
        items: items
    };

    return list;
};

internals.SnackQueue.prototype.registerSocketIO = function () {

    var self = this;

    var socketIO = this.socketIO;

    if (socketIO) {

        socketIO.of('/jobs').on('connection', function (socket) {

            self.queue.on('job complete', function (id) {
                Job.get(id, function (err, job) {
                    if (err) return;

                    socket.emit('job', {
                        event: 'complete',
                        job: job
                    });
                });
            });

            self.queue.on('job progress', function (progress, id) {
                Job.get(id, function (err, job) {
                    if (err) return;

                    socket.emit('job', {
                        event: 'progress',
                        job: job
                    });
                });
            });

            self.queue.on('job failed', function (id) {
                Job.get(id, function (err, job) {
                    if (err) return;

                    socket.emit('job', {
                        event: 'failed',
                        job: job
                    });
                });
            });

            self.queue.on('job failed attempt', function (id) {
                Job.get(id, function (err, job) {
                    if (err) return;

                    socket.emit('job', {
                        event: 'retry',
                        job: job
                    });
                });
            });
        });
    }
};

module.exports = internals.SnackQueue;

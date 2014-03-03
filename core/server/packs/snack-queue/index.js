/* jshint expr: true */

var Kue = require('kue'),
    Job = Kue.Job;

var defaults = {
    attempts: 3,
    basePath: '',
    kue: {
        host: 'localhost',
        port: 6379,
        disableSearch: true
    }
};

var internals = {};

internals.SnackQueue = function (plugin, options) {

    var Hapi = plugin.hapi;

    this._settings = Hapi.utils.applyToDefaults(defaults, options);

    this.plugin = plugin;
    this.hapi = Hapi;

    this.queue = Kue.createQueue(this._settings.kue);
    this.socketIO = this.loadSocketIO();

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
    if (options.attempts) job.attempts(parseInt(settings.attempts));
    if (options.priority) job.priority(options.priority);
    if (options.delay) job.delay(options.delay);

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

internals.SnackQueue.prototype.getJob = function (job, done) {

    Job.get(job.id, function (err, job) {

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

    plugin.method({
        name: 'snackQueue',
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

exports.register = function (plugin, options, next) {

    var snackQueue = new internals.SnackQueue(plugin, options);

    snackQueue.registerMethods();
    snackQueue.registerRoutes();
    snackQueue.registerSocketIO();

    next();
};

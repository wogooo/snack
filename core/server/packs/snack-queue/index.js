/* jshint expr: true */

var Kue = require('kue'),
    Job = Kue.Job;

var defaults = {
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

    this.debug();
};

internals.SnackQueue.prototype.debug = function () {
    this.queue.on('job complete', function (id) {
        console.log('job complete:', id);
        // Job.get(id, function (err, job) {
        //     if (err) return;
        //     job.remove(function (err) {
        //         if (err) throw err;
        //         console.log('removed completed job #%d', job.id);
        //     });
        // });
    });

    this.queue.on('job progress', function (progress, id) {
        console.log('job progress:', progress, id);
    });

    this.queue.on('job failed', function (id) {
        console.log('job failed:', id);
    });
};

internals.SnackQueue.prototype.createJob = function (task, done) {

    var settings = this._settings;
    var basePath = settings.basePath;

    if (!task.type) {
        return done(new Error('Must provide job type'));
    }

    var job = new Job(task.type, task.data || {});

    var options = task.options || {};
    if (options.attempts) job.attempts(parseInt(options.attempts));
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
        path: basePath + '/queue/stats',
        handler: function (request, reply) {
            sq.stats(function (err, result) {
                if (error) {
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
        path: basePath + '/queue/job/{id}',
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
        path: basePath + '/queue/job/{id}/log',
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
        path: basePath + '/queue/job/{id}',
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
        path: basePath + '/queue/job',
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

exports.register = function (plugin, options, next) {

    var snackQueue = new internals.SnackQueue(plugin, options);

    snackQueue.registerMethods();
    snackQueue.registerRoutes();

    next();
};

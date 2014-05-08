var Hapi = require('hapi'),
    Async = require('async'),
    Promise = require('bluebird');

function Enqueue(options) {

    this.server = options.server;
    this.config = options.config;
}

Enqueue.prototype._apiEndpoint = function (type, id) {

    var Config = this.config;

    if (!type || !id) {
        return '';
    }

    var context = 'api';

    var data = {
        api: {
            type: type,
            id: id,
            format: 'json'
        }
    };

    var endpoint = Config.urlFor(context, data, true);

    return endpoint;
};

Enqueue.prototype._startJob = function (id) {

    var server = this.server;

    function start() {
        server.methods.queue('startJob', {
            id: id
        });
    }

    return start;
};

Enqueue.prototype._enqueue = function (hook, item, done) {

    var self = this;

    var Server = this.server;
    var Config = this.config;

    var endpoint = this._apiEndpoint(item.type, item.id);

    var task = {
        type: 'snack-app',
        data: {
            event: hook,
            type: item.type,
            id: item.id,
            cleanup: Boolean(item.cleanup),
            endpoint: endpoint
        }
    };

    if (item.obj) {

        // It may be necessary to send the object with the job,
        // for example, in a delete.
        task.data.obj = JSON.stringify(item.obj);
    }

    if (item.dirty) {
        task.data.dirty = JSON.stringify(item.dirty);
    }

    Server.methods.queue('createJob', task, function (err, job) {

        if (err) return done(err);

        var queuePath = Config.urlFor('api', {
            api: {
                type: 'job',
                id: job.id
            }
        });

        var queued = {
            id: job.id,
            path: queuePath,
            start: self._startJob(job.id)
        };

        done(null, queued);
    });
};

Enqueue.prototype._enqueueItem = function (model, hook, next) {

    var destroyed = false;

    var queueItem = {
        type: model.type,
        id: model.id,
        cleanup: true
    };

    if (model.__dirty) {

        // Check private data for dirty fields
        queueItem.dirty = model.__dirty;;
    }

    if (hook.search('.destroyed') > -1) {

        // When destroying, embed the model and no
        // cleanup required.
        queueItem.obj = model;
        queueItem.cleanup = false;
        destroyed = true;
    }

    this._enqueue(hook, queueItem, function (err, job) {

        if (err) return next(err);

        if (job && destroyed) {
            queued.start();
            return next();
        }

        // Job is queued, and in delayed state
        if (job) {

            // Place latest queue item at top, for easy reference
            model._queue_.unshift({
                id: job.id,
                path: job.path
            });

            next(null, job);

            // Persist to db
            model.save()
                .then(function () {

                    // Finally start the job
                    job.start();
                    next();
                })
                .catch(function (err) {
                    next(err);
                });

            return;
        }

        next();
    });
};

Enqueue.prototype.add =  function (model, event) {

    var self = this,
        Config = this.config,
        hooks = Config().hooks,
        hook = model.type + '.' + event;

    if (!hooks[hook]) {

        // This hook is not enabled.
        return Promise.resolve(model);
    }

    var promise = new Promise(function (resolve, reject) {

        self._enqueueItem(model, hook, function (err) {

            if (err) {
                reject(err);
            } else {
                resolve(model);
            }
        });
    });

    return promise;
};

module.exports = Enqueue;

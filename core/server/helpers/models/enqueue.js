var Hapi = require('hapi'),
    Promise = require('bluebird');

function Enqueue(options) {

    this.server = options.server;
    this.config = options.server.app.config;
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

    var server = this.server;
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

    server.methods.queue('createJob', task, function (err, job) {

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

Enqueue.prototype._enqueueItem = function (doc, hook, next) {

    var destroyed = false;

    var queueItem = {
        type: doc.type,
        id: doc.id,
        cleanup: true
    };

    var dirty = doc.getPrivate('dirty');

    if (dirty) {

        // Check private data for dirty fields
        queueItem.dirty = dirty;
    }

    if (hook.search('destroyed') > -1) {

        // When destroying, embed the doc and no
        // cleanup required.
        queueItem.obj = doc;
        queueItem.cleanup = false;
        destroyed = true;
    }

    this._enqueue(hook, queueItem, function (err, job) {

        if (err) return next(err);

        next(null, job);
    });
};

Enqueue.prototype.add =  function (doc, event) {

    var self = this,
        Config = this.config,
        hooks = Config().hooks,
        hook = doc.type + '.' + event;

    if (!hooks[hook]) {

        // This hook is not enabled.
        return Promise.resolve();
    }

    var promise = new Promise(function (resolve, reject) {

        self._enqueueItem(doc, hook, function (err, job) {

            if (err) {
                reject(err);
            } else {
                resolve(job);
            }
        });
    });

    return promise;
};

module.exports = Enqueue;

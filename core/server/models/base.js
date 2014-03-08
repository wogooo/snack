var internals = {};

internals.Base = function (options) {

    this.server = options.server;
    this.config = options.config;
};

internals.Base.prototype._enqueue = function (hook, item, done) {

    var self = this;

    var server = this.server;
    var Config = this.config;

    var endpoint = this._apiEndpoint(item.type, item.id);

    var task = {
        type: hook,
        data: {
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

    server.methods.queue('createJob', task, function (err, job) {

        if (err) return done(err);

        var queuePath = Config.urlFor('api', {
            api: {
                type: 'job',
                id: job.id
            }
        });

        var queued = {
            path: queuePath,
            start: self._startJob(job.id)
        };

        done(null, queued);
    });
};

internals.Base.prototype._apiEndpoint = function (type, id) {

    var Config = this.config;

    if (!type || !id) {
        return '';
    }

    var context = 'api';

    var data = {
        api: {
            type: type,
            id: id
        }
    };

    var endpoint = Config.urlFor(context, data, true);

    return endpoint;
};


internals.Base.prototype._startJob = function (id) {

    var server = this.server;

    function start() {
        server.methods.queue('startJob', {
            id: id
        });
    }

    return start;
};

internals.enqueue = function (model) {

    var server = model.server;
    var Config = model.config;

    var base = new internals.Base({
        server: server,
        config: Config
    });

    return function (hook, item, cleanup, done) {
        base._enqueue(hook, item, cleanup, done);
    };
};

exports.init = function (model, next) {

    exports.enqueue = internals.enqueue(model);

    next();
};

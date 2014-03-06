var Schema = require('jugglingdb').Schema;
var Config = require('../config');
var server = {};

var internals = {};

internals.dependencies = [];

internals._apiEndpoint = function (type, id) {

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

internals._enqueue = function (hook, item, cleanup, done) {

    var endpoint = internals._apiEndpoint(item.type, item.id);

    var task = {
        type: hook,
        data: {
            type: item.type,
            id: item.id,
            cleanup: Boolean(cleanup),
            endpoint: endpoint
        }
    };

    server.methods.snackQueue('createJob', task, function (err, result) {

        if (err) return done(err);

        var queuePath = Config.urlFor('api', {
            api: {
                type: 'job',
                id: result.id
            }
        });

        done(null, queuePath);
    });
};

internals.init = function (model, next) {

    var Snack = model.snack;
    var config = Snack.config();

    server = model.server;
    var schema = model.schema;
    var models = model.models;

    var Asset = schema.define('Asset', {
        id: {
            type: String,
            index: true
        },
        type: {
            type: String,
            default: 'file'
        },
        etag: {
            type: String,
            default: null
        },
        filename: String,
        mimetype: String,
        bytes: Number,
        storage: {
            type: String,
            default: 'local'
        },
        path: {
            type: String,
            length: 2000
        },
        url: {
            type: String,
            length: 2000
        },
        createdAt: {
            type: Date,
            index: true,
            default: function () {
                return new Date();
            }
        },
        updatedAt: {
            type: Date,
            index: true,
            default: function () {
                return new Date();
            }
        },
        available: {
            type: Boolean,
            default: true,
            index: true
        },
        title: {
            type: String,
            length: 255
        },
        description: {
            type: Schema.Text
        },
        timestamp: {
            type: Number,
            default: Date.now,
            index: true
        },
        data: {
            type: {},
            default: null
        },
        queue: {
            type: String,
            length: 2000,
            default: null
        }
    });

    Asset.beforeCreate = function (next, data) {

        var mimeRegex = /^([a-z]+)\//;
        var mimeType = this.mimetype;

        // Get a more useful, human type from the mimetype.
        if (mimeType && mimeRegex.test(mimeType)) {
            data.type = mimeType.match(mimeRegex)[1];
        }

        next();
    };

    Asset.beforeUpdate = function (next, data) {

        // Private data
        var _data = this.__data;

        // Always set a new timestsamp
        var now = Date.now();

        data.timestamp = now;
        data.updatedAt = new Date(now).toJSON();

        if (_data.clearQueue === true) {

            // Clearing the queue
            data.queue = null;
        }

        next();
    };

    Asset.afterCreate = function (next) {

        var self = this;

        if (config.hooks['asset.created']) {

            internals._enqueue('asset.created', {
                type: this.constructor.modelName,
                id: this.id
            }, true, function (err, queuePath) {

                if (err) return next(err);

                self.updateAttributes({
                        queue: queuePath
                    },
                    function (err) {
                        next(err);
                    });
            });

            return;
        }

        next();
    };


    models.Asset = Asset;

    next();
};

exports.dependencies = internals.dependencies;
exports.init = internals.init;

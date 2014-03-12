var Schema = require('jugglingdb').Schema;

var modelName = 'Asset';

var internals = {};

internals.dependencies = [];

internals.init = function (model, next) {

    var Snack = model.snack;
    var hooks = Snack.config().hooks;

    var schema = model.schema;
    var models = model.models;

    var Model = schema.define(modelName, {
        id: {
            type: String,
            index: true
        },
        type: {
            type: String,
            default: modelName.toLowerCase()
        },
        kind: {
            type: String,
            default: 'file',
            index: true
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
        key: {
            type: String,
            length: 2000,
            index: true
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
        deleted: {
            type: Boolean,
            default: false,
            index: true
        },
        title: {
            type: String,
            length: 255
        },
        description: {
            type: Schema.Text
        },
        data: {
            type: Schema.JSON,
            default: null
        },
        removeLocal: {
            type: Boolean,
            default: false
        },
        timestamp: {
            type: Number,
            default: Date.now,
            index: true
        },
        queue: {
            type: String,
            length: 2000,
            default: null
        }
    });

    Model.validatesPresenceOf('filename', 'key', 'mimetype', 'bytes');

    // Key must be unqiue!
    Model.validatesUniquenessOf('key', {
        message: 'Key is not unique.'
    });

    Model.beforeCreate = function (next, data) {

        var mimeRegex = /^([a-z]+)\//;
        var mimeType = this.mimetype;

        // Get a more useful, human type from the mimetype.
        if (mimeType && mimeRegex.test(mimeType)) {
            data.kind = mimeType.match(mimeRegex)[1];
        }

        next();
    };

    Model.beforeUpdate = function (next, data) {

        // Private data
        var _data = this.__data,
            now = Date.now();

        // Always set a new timestsamp
        data.timestamp = now;
        data.updatedAt = new Date(now).toJSON();

        if (_data.clearQueue === true) {

            // Clearing the queue
            data.queue = null;
        }

        if (this.storage !== 'local' && this.storage_was === 'local') {

            // Mark asset so cleanup can happen later
            data.removeLocal = true;
        }

        next();
    };

    Model.afterCreate = function (next) {

        next();
    };

    Model.afterUpdate = function (next) {

        next();
    };

    Model.beforeDestroy = function (next) {

        next();
    };

    models[modelName] = Model;

    next();
};

exports.dependencies = internals.dependencies;
exports.init = internals.init;

var Schema = require('jugglingdb').Schema;
var Uslug = require('uslug');

var modelName = 'Tag';

var internals = {};

internals.modelName = modelName;

internals.init = function (model, next) {

    var server = model.server;
    var schema = model.schema;
    var models = model.models;
    var Config = model.config;

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
            index: true,
            type: String,
            default: 'tags'
        },
        key: {
            index: true,
            type: String,
            length: 2000
        },
        name: {
            type: String
        },
        description: {
            type: Schema.Text,
            default: null
        },
        updatedAt: {
            index: true,
            type: Date
        },
        _version_: {
            type: Number
        },
        _queue_: {
            type: []
        }
    });

    Model.validatesPresenceOf('name', 'key', '_version_');

    // Key must be unqiue!
    Model.validatesUniquenessOf('key', {
        message: 'Key is not unique.'
    });

    Model.beforeValidate = function (next, data) {

        if (!this.key) {

            // Key is a little like S3 keys -- in some cases it
            // would generate a path, but it also supports
            // subgroupings of items that might otherwise have the
            // same slug.
            this.key = Uslug(this.kind) + '/' + Uslug(this.name);
        }

        // Want the updatedAt and version identical
        var now = Date.now();

        this._version_ = now;
        this.updatedAt = new Date(now).toJSON();

        next();
    };

    Model.beforeUpdate = function (next, data) {

        // Private data
        var _data = this.__data;

        if (_data.clearQueue) {

            // Clearing the queue
            var jobId = _data.clearQueue;
            this._queue_.remove(jobId);
        }

        next();
    };

    models[modelName] = Model;

    next();
};

exports.init = internals.init;

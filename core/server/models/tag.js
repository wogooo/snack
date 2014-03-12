var Schema = require('jugglingdb').Schema;
var Uslug = require('uslug');

var modelName = 'Tag';

var internals = {};

internals.dependencies = [];

internals.init = function (model, next) {

    var server = model.server;
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
            index: true,
            default: 'tags'
        },
        key: {
            type: String,
            length: 2000,
            index: true
        },
        name: {
            type: String
        },
        description: {
            type: Schema.Text,
            default: null
        },
        updatedAt: {
            type: Date
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

    Model.validatesPresenceOf('name', 'key');

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

        if (!this.updatedAt) {

            // Want the updatedAt and timestamp identical
            this.updatedAt = new Date(this.timestamp).toJSON();
        }

        next();
    };

    Model.beforeSave = function (next, data) {
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

        next();
    };

    models[modelName] = Model;

    next();
};

module.exports = internals;

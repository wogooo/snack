var Schema = require('jugglingdb').Schema;
var Uslug = require('uslug');

var internals = {};

internals.name = 'User';

internals.relations = function (model, next) {

    var modelName = internals.name;
    var models = model.models;
    var Model = models[modelName];

    Model.hasMany('posts', {
        foreignKey: 'ownerId'
    });

    Model.hasMany('assets', {
        as: 'owner',
        model: models.Asset
    });

    Model.hasMany('pages', {
        as: 'owner',
        model: models.Page
    });

    next();
};

internals.definition = function () {

    var modelName = internals.name;

    return {
        modelName: {
            type: String,
            length: 255,
            default: modelName
        },
        id: {
            type: String,
            index: true
        },
        type: {
            type: String,
            length: 255,
            default: modelName.toLowerCase()
        },
        key: {
            index: true,
            type: String,
            length: 255
        },
        displayName: {
            type: String,
            length: 255
        },
        email: {
            type: String,
            length: 255
        },
        updatedAt: {
            index: true,
            type: Date
        },
        _version_: {
            type: Number
        },
        _queue_: {
            type: String,
            length: 2000,
            default: null
        }
    };
};

internals.register = function (model, next) {

    var server = model.server;
    var schema = model.schema;
    var models = model.models;

    var modelName = internals.name;
    var definition = internals.definition();

    var Model = schema.define(modelName, definition);

    Model.validatesPresenceOf('key', 'displayName', '_version_');

    Model.validatesUniquenessOf('key', {
        message: 'Key is not unique.'
    });

    Model.beforeValidate = function (next, data) {

        if (!this.key) {

            // Key is a little like S3 keys -- in some cases it
            // would generate a path, but it also supports
            // subgroupings of items that might otherwise have the
            // same slug.
            this.key = Uslug(this.displayName);
        }

        // Want the updatedAt and version identical
        var now = Date.now();

        this._version_ = now;
        this.updatedAt = new Date(now).toJSON();

        next();
    };

    model.expose(Model);
    model.after(internals.relations);

    next();
};

exports.name = internals.name;
exports.definition = internals.definition;
exports.register = internals.register;

var Schema = require('jugglingdb').Schema;

var modelName = 'User';

var internals = {};

internals.modelName = modelName;

internals.relations = function (model, next) {

    var models = model.models;
    var Model = models[modelName];

    // Model.hasMany('posts', {
    //     model: models.Post
    // });

    Model.hasMany('assets', {
        model: models.Asset
    });

    Model.hasMany('pages', {
        model: models.Page
    });

    next();
};

internals.register = function (model, next) {

    model.after(internals.relations);

    var server = model.server;
    var schema = model.schema;
    var models = model.models;

    var Model = schema.define(modelName, {
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
    });

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

    models[modelName] = Model;

    next();
};

exports.register = internals.register;

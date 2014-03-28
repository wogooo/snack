var Schema = require('jugglingdb').Schema;

var modelName = 'Asset';

var internals = {};

internals.modelName = modelName;

internals.relations = function (model, next) {

    var models = model.models;
    var Model = models[modelName];

    Model.belongsTo('owner', {
        model: models.User
    });

    Model.hasAndBelongsToMany('tags', {
        model: models.Tag
    });

    Model.hasAndBelongsToMany('posts', {
        model: models.Post
    });

    Model.belongsTo(models.User, {
        as: '_createdBy',
        foreignKey: 'createdById'
    });

    Model.belongsTo(models.User, {
        as: '_updatedBy',
        foreignKey: 'updatedById'
    });

    next();
};

internals.register = function (model, next) {

    var Snack = model.snack;
    var Config = model.config;
    var hooks = Config().hooks;

    var schema = model.schema;
    var models = model.models;

    var Model = schema.define(modelName, {
        id: String,
        type: {
            type: String,
            length: 255,
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
            type: String
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
        height: Number,
        width: Number,
        data: {
            type: Schema.JSON,
            default: null
        },
        _version_: {
            type: Number,
            default: Date.now,
            index: true
        },
        _queue_: {
            type: []
        }
    });

    Model.validatesPresenceOf('filename', 'key', 'mimetype', 'bytes', '_version_');

    // Key must be unqiue!
    Model.validatesUniquenessOf('key', {
        message: 'Key is not unique.'
    });

    Model.beforeValidate = function (next, data) {

        // Want the updatedAt and version identical
        var now = Date.now();

        this._version_ = now;
        this.updatedAt = new Date(now).toJSON();

        next();
    };

    Model.beforeCreate = function (next, data) {

        var mimeRegex = /^([a-z]+)\//;
        var mimeType = this.mimetype;

        // Get a more useful, human type from the mimetype.
        if (mimeType && mimeRegex.test(mimeType)) {
            data.kind = mimeType.match(mimeRegex)[1];
        }

        if (!data.updatedById) {
            this.updatedById = data.createdById;
        }

        if (!data.ownerId) {
            this.ownerId = data.createdById;
        }

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

        if (this.storage !== 'local' && this.storage_was === 'local') {

            // Mark asset so cleanup can happen later
            data._removeLocal_ = true;
        }

        next();
    };

    model.expose(Model);
    model.after(internals.relations);

    next();
};

exports.register = internals.register;

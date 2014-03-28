var Hapi = require('hapi');
var Utils = Hapi.utils;
var HtmlStrip = require('htmlstrip-native').html_strip;
var Schema = require('jugglingdb').Schema;
var Uslug = require('uslug');

var internals = {};

internals.modelName = 'Post';

internals.modelDefinition = function () {

    var modelName = internals.modelName;

    return {
        title: {
            type: String,
            length: 255
        },
        headline: {
            type: Schema.Text
        },
        key: {
            index: true,
            type: String,
            length: 255
        },
        type: {
            type: String,
            length: 255,
            default: modelName.toLowerCase()
        },
        kind: {
            index: true,
            type: String,
            length: 255,
            default: 'article'
        },
        body: {
            type: Schema.Text
        },
        language: String,
        page: {
            index: true,
            type: Boolean,
            default: false
        },
        createdAt: {
            index: true,
            type: Date,
            default: function () {
                return new Date();
            }
        },
        updatedAt: {
            index: true,
            type: Date
        },
        publishedAt: {
            index: true,
            type: Date,
            default: function () {
                return new Date();
            }
        },
        availableAt: {
            type: Date,
            default: function () {
                return new Date();
            }
        },
        deleted: {
            index: true,
            type: Boolean,
            default: false
        },

        // Private properties, wouldn't get copied
        // to a revision for instance.
        _queue_: [],
        _version_: Number,

        // Model has not been finalized yet, so `created` hook hasn't
        // been fired, shouldn't appear in indexes, etc.
        _draft_: {
            index: true,
            type: Boolean,
            default: true
        }
    };
};

internals.relations = function (model, next) {

    var modelName = internals.modelName;
    var models = model.models;
    var Model = models[modelName];

    Model.belongsTo('owner', {
        model: models.User
    });

    Model.hasAndBelongsToMany('tags', {
        model: models.Tag
    });

    Model.hasAndBelongsToMany('assets', {
        model: models.Asset
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

    var modelName = internals.modelName,
        Snack = model.snack,
        Config = Snack.config,
        schema = model.schema,
        definition = internals.modelDefinition();

    var Model = schema.define(modelName, definition);

    Model.validatesPresenceOf('_version_');

    // Key must be unqiue!
    // Model.validatesUniquenessOf('key', {
    //     message: 'Key is not unique.'
    // });

    Model.beforeValidate = function (next, data) {

        // Private data
        var _data = this.__data,
            now = Date.now();

        var stripOpts = {
            'compact_whitespace': true
        };

        if (this.headline) {
            this.title = HtmlStrip(this.headline, stripOpts).trim();
        }

        if (!this.key) {

            // TODO: pass keys through config and allow patterns?

            // Key is a little like S3 keys -- in some cases it
            // would generate a path, but it also supports
            // subgroupings of items that might otherwise have the
            // same slug.

            this.key = Uslug(this.kind) + '/' + Uslug(this.title);
        }

        // Want the updatedAt and version identical
        this._version_ = now;
        this.updatedAt = new Date(now).toJSON();

        next();
    };

    Model.beforeCreate = function (next, data) {

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

        next();
    };

    model.expose(Model);
    model.after(internals.relations);

    next();
};

exports.name = internals.modelName;
exports.definition = internals.modelDefinition;
exports.register = internals.register;

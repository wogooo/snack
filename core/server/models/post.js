var Hapi = require('hapi');
var Utils = Hapi.utils;
var HtmlStrip = require('htmlstrip-native').html_strip;
var Schema = require('jugglingdb').Schema;
var Uslug = require('uslug');

var modelName = 'Post';

var internals = {};

internals.modelName = modelName;

internals.relations = function (model, next) {

    var models = model.models;
    var Model = models[modelName];

    // Model.belongsTo('owner', {
    //     model: models.User
    // });

    Model.hasAndBelongsToMany('tags', {
        model: models.Tag
    });

    Model.hasAndBelongsToMany('assets', {
        model: models.Asset
    });

    next();
};

internals.register = function (model, next) {

    model.after(internals.relations);

    var Snack = model.snack;
    var Config = model.config;
    var schema = model.schema;
    var models = model.models;

    var hooks = Config().hooks;

    var Model = schema.define(modelName, {
        id: {
            type: String,
            index: true
        },
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
        _created_: {
            index: true,
            type: Boolean,
            default: false
        }
    });

    Model.validatesPresenceOf('_version_');

    // Key must be unqiue!
    Model.validatesUniquenessOf('key', {
        message: 'Key is not unique.'
    });

    Model.beforeValidate = function (next, data) {

        // Private data
        var _data = this.__data;

        if (!this.key) {

            // TODO: pass keys through config and allow patterns?

            // Key is a little like S3 keys -- in some cases it
            // would generate a path, but it also supports
            // subgroupings of items that might otherwise have the
            // same slug.

            this.key = Uslug(this.kind) + '/' + Uslug(this.title);
        }

        if (!this.title && this.headline) {
            this.title = HtmlStrip(this.headline, { 'compact_whitespace': true }).trim();
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

exports.register = internals.register;

var Hapi = require('hapi');
var Utils = Hapi.utils;
var Schema = require('jugglingdb').Schema;
var _ = require('lodash');
var Uslug = require('uslug');

var Config = require('../config');

var internals = {};

internals.name = 'Page';

internals.definition = function () {

    var modelName = internals.name;

    return {
        id: {
            type: String,
            index: true
        },
        title: {
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
            default: 'page'
        },
        content: {
            type: Schema.Text
        },
        createdAt: {
            type: Date,
            default: function () {
                return new Date();
            }
        },
        updatedAt: {
            type: Date,
            default: function () {
                return new Date();
            }
        },
        publishedAt: {
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
        available: {
            type: Boolean,
            default: false,
            index: true
        },
        deleted: {
            type: Boolean,
            default: false,
            index: true
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

internals.relations = function (model, next) {

    var modelName = internals.name,
        models = model.models,
        Model = models[modelName];

    Model.belongsTo('owner', {
        model: models.User
    });

    Model.hasAndBelongsToMany('tags', {
        model: models.Tag
    });

    Model.hasAndBelongsToMany('assets', {
        model: models.Asset
    });

    next();
};

internals.register = function (model, next) {

    var Snack = model.snack,
        schema = model.schema,
        modelName = internals.name,
        definition = internals.definition(),
        Model;

    Model = schema.define(modelName, definition);

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

        // Want the updatedAt and version identical
        var now = Date.now();

        this._version_ = now;
        this.updatedAt = new Date(now).toJSON();

        next();
    };

    Model.beforeUpdate = function (next, data) {

        // Private data
        var _data = this.__data;

        if (_data.clearQueue === true) {

            // Clearing the queue
            data._queue_ = null;
        }

        next();
    };

    model.expose(Model);
    model.after(internals.relations);

    next();
};

exports.name = internals.name;
exports.definition = internals.definition;
exports.register = internals.register;

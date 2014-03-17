var Hapi = require('hapi');
var Utils = Hapi.utils;
var Schema = require('jugglingdb').Schema;
var _ = require('lodash');
var Uslug = require('uslug');

var Config = require('../config');

var modelName = 'Page';

var server = {};

var internals = {};

internals.modelName = modelName;

internals.dependencies = ['User', 'Tag', 'Asset'];

internals.init = function (model, next) {

    server = model.server;

    var Snack = model.snack;
    var config = Snack.config();

    var schema = model.schema;
    var models = model.models;

    var Model = schema.define(modelName, {
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
            type: String,
            length: 255,
            default: 'simple'
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
    });

    Model.hasAndBelongsToMany('authors', {
        model: models.User
    });

    Model.hasAndBelongsToMany('tags', {
        model: models.Tag
    });

    Model.hasAndBelongsToMany('assets', {
        model: models.Asset
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

    models[modelName] = Model;

    next();
};

exports.dependencies = internals.dependencies;
exports.init = internals.init;

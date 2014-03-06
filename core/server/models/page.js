var Hapi = require('hapi');
var Utils = Hapi.utils;
var Schema = require('jugglingdb').Schema;
var _ = require('lodash');

var Config = require('../config');

var server = {};

var internals = {};

internals.dependencies = ['User', 'Tag', 'Asset'];

internals._apiEndpoint = function (type, id) {

    if (!type || !id) {
        return '';
    }

    var context = 'api';

    var data = {
        api: {
            type: type,
            id: id
        }
    };

    var endpoint = Config.urlFor(context, data, true);

    return endpoint;
};

internals._enqueue = function (hook, item, cleanup, done) {

    var endpoint = internals._apiEndpoint(item.type, item.id);

    var task = {
        type: hook,
        data: {
            type: item.type,
            id: item.id,
            cleanup: Boolean(cleanup),
            endpoint: endpoint
        }
    };

    server.methods.snackQueue('createJob', task, function (err, result) {

        if (err) return done(err);

        var queuePath = Config.urlFor('api', {
            api: {
                type: 'job',
                id: result.id
            }
        });

        done(null, queuePath);
    });
};

internals.init = function (model, next) {

    server = model.server;

    var Snack = model.snack;
    var config = Snack.config();

    var schema = model.schema;
    var models = model.models;

    var Page = schema.define('Page', {
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
            default: 'page'
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
        timestamp: {
            type: Number,
            default: Date.now
        },
        deleted: {
            type: Boolean,
            default: false,
            index: true
        },
        queue: {
            type: String,
            length: 2000,
            default: null
        }
    });

    Page.hasAndBelongsToMany('authors', {
        model: models.User
    });

    Page.hasAndBelongsToMany('tags', {
        model: models.Tag
    });

    Page.hasAndBelongsToMany('assets', {
        model: models.Asset
    });

    Page.afterCreate = function (next) {

        var self = this;

        if (config.hooks['page.created']) {

            internals._enqueue('page.created', {
                type: this.constructor.modelName,
                id: this.id
            }, true, function (err, queuePath) {

                if (err) return next(err);

                self.updateAttributes({
                        queue: queuePath
                    },
                    function (err) {
                        next(err);
                    });
            });

            return;
        }

        next();
    };

    Page.beforeUpdate = function (next, data) {

        // Private data
        var _data = this.__data;

        // Always set a new timestsamp
        data.timestamp = Date.now();

        if (_data.clearQueue === true) {

            // Clearing the queue
            data.queue = null;
        }

        next();
    };

    Page.afterUpdate = function (next) {

        var self = this;

        // Private data
        var _data = this.__data;

        if (!this.queue && _data.clearQueue !== true) {

            if (config.hooks['page.updated'] || config.hooks['page.deleted']) {

                internals._enqueue(this.deleted ? 'page.deleted' : 'page.updated', {
                    type: this.constructor.modelName,
                    id: this.id
                }, true, function (err, queuePath) {

                    if (err) return next();

                    var attr = {
                        queue: queuePath
                    };

                    self.updateAttributes(attr, function (err) {

                        next(err);
                    });
                });
            }

        } else {

            next();
        }
    };

    Page.beforeDestroy = function (next) {

        if (config.hooks['page.destroyed']) {

            internals._enqueue('page.destroyed', {
                type: this.constructor.modelName,
                id: this.id
            }, false, function (err) {

                next(err);
            });
        }
    };

    models.Page = Page;

    next();
};

exports.dependencies = internals.dependencies;
exports.init = internals.init;

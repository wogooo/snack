var Hapi = require('hapi');
var Utils = Hapi.utils;
var Schema = require('jugglingdb').Schema;
var _ = require('lodash');

var Base = require('./base');

var internals = {};

internals.dependencies = ['User', 'Tag', 'Asset', 'Base'];

internals.init = function (model, next) {

    var Snack = model.snack;
    var hooks = Snack.config().hooks;

    var schema = model.schema;
    var models = model.models;

    var Post = schema.define('Post', {
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
            default: 'post'
        },
        kind: {
            type: String,
            length: 255,
            default: 'article'
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
        timestamp: {
            type: Number,
            default: Date.now
        },
        queue: {
            type: String,
            length: 2000,
            default: null
        }
    });

    Post.hasAndBelongsToMany('authors', {
        model: models.User
    });

    Post.hasAndBelongsToMany('tags', {
        model: models.Tag
    });

    Post.hasAndBelongsToMany('assets', {
        model: models.Asset
    });

    // Post.getAll = function (fields, options, callback) {
    //     fields = fields || [];
    //     options = options || {};

    //     this.all({
    //         include: fields
    //     }, function (err, results) {

    //         if (err) {
    //             return callback(err);
    //         }

    //         if (options.toJSON) {

    //             var resultJSON, relations;
    //             results.forEach(function (result, index) {
    //                 relations = result.__cachedRelations;
    //                 resultJSON = result.toJSON();
    //                 resultJSON = _.extend(resultJSON, relations);
    //                 results[index] = resultJSON;
    //             });
    //         }

    //         callback(err, results);
    //     });
    // };

    Post.afterCreate = function (next) {

        var self = this;

        if (hooks['post.created']) {

            var queueItem = {
                type: this.constructor.modelName,
                id: this.id,
                cleanup: true
            };

            Base.enqueue('post.created', queueItem, function (err, queued) {
                if (err) return next(err);

                var attr = {
                    queue: queued.path
                };

                self.updateAttributes(attr, function (err) {

                    queued.start();
                    next(err);
                });
            });

            return;
        }

        next();
    };

    Post.beforeUpdate = function (next, data) {

        // Private data
        var _data = this.__data;

        // Always set a new timestsamp
        var now = Date.now();

        data.timestamp = now;
        data.updatedAt = new Date(now).toJSON();

        if (_data.clearQueue === true) {

            // Clearing the queue
            data.queue = null;
        }

        next();
    };

    Post.afterUpdate = function (next) {

        var self = this;

        // Private data
        var _data = this.__data;

        if (!this.queue && _data.clearQueue !== true) {

            if (hooks['post.updated'] || hooks['post.deleted']) {

                var hook = this.deleted ? 'post.deleted' : 'post.updated';

                var queueItem = {
                    type: this.constructor.modelName,
                    id: this.id,
                    cleanup: true
                };

                Base.enqueue(hook, queueItem, function (err, queued) {

                    if (err) return next();

                    var attr = {
                        queue: queued.path
                    };

                    self.updateAttributes(attr, function (err) {

                        queued.start();
                        next(err);
                    });
                });
            }

        } else {

            next();
        }
    };

    Post.beforeDestroy = function (next) {

        if (hooks['post.destroyed']) {

            var queueItem = {
                type: this.constructor.modelName,
                id: this.id,
                obj: this
            };

            Base.enqueue('post.destroyed', queueItem, function (err) {

                next(err);
            });
        }
    };

    models.Post = Post;

    next();
};

exports.dependencies = internals.dependencies;
exports.init = internals.init;

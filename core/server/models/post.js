var Hapi = require('hapi');
var Utils = Hapi.utils;
var Schema = require('jugglingdb').Schema;
var Uslug = require('uslug');

var Base = require('./base');

var modelName = 'Post';

var internals = {};

internals.dependencies = ['User', 'Tag', 'Asset', 'Base'];

internals.init = function (model, next) {

    var Snack = model.snack;
    var hooks = Snack.config().hooks;

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
        key: {
            type: String,
            length: 255,
            index: true
        },
        type: {
            type: String,
            length: 255,
            default: modelName.toLowerCase()
        },
        kind: {
            type: String,
            length: 255,
            default: 'article'
        },
        body: {
            type: Schema.Text
        },
        createdAt: {
            type: Date,
            default: function () {
                return new Date();
            }
        },
        updatedAt: {
            type: Date
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

    Model.validatesPresenceOf('title', 'key');

    // Key must be unqiue!
    Model.validatesUniquenessOf('key', {
        message: 'Key is not unique.'
    });

    // Model.hasAndBelongsToMany('authors', {
    //     model: models.User
    // });

    Model.hasAndBelongsToMany('tags', {
        model: models.Tag
    });

    Model.hasAndBelongsToMany('assets', {
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

    Model.beforeValidate = function (next, data) {

        if (!this.key) {

            // TODO: pass keys through config and allow patterns?

            // Key is a little like S3 keys -- in some cases it
            // would generate a path, but it also supports
            // subgroupings of items that might otherwise have the
            // same slug.

            this.key = Uslug(this.kind) + '/' + Uslug(this.title);
        }

        if (!this.updatedAt) {

            // Want the updatedAt and timestamp identical
            data.updatedAt = new Date(this.timestamp).toJSON();
        }

        next();
    };

    Model.afterCreate = function (next) {

        var self = this;

        // if (hooks['post.created']) {

        //     var queueItem = {
        //         type: this.constructor.modelName,
        //         id: this.id,
        //         cleanup: true
        //     };

        //     Base.enqueue('post.created', queueItem, function (err, queued) {
        //         if (err) return next(err);

        //         var attr = {
        //             queue: queued.path
        //         };

        //         self.updateAttributes(attr, function (err) {

        //             queued.start();
        //             next(err);
        //         });
        //     });

        //     return;
        // }

        next();
    };

    Model.beforeUpdate = function (next, data) {

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

    Model.afterUpdate = function (next) {

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

    Model.beforeDestroy = function (next) {

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

    models[modelName] = Model;

    next();
};

exports.dependencies = internals.dependencies;
exports.init = internals.init;

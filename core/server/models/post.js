var Hapi = require('hapi');
var Utils = Hapi.utils;
var Schema = require('jugglingdb').Schema;
var _ = require('lodash');

var Config = require('../config');
var config = Config();

var server = {};

var internals = {};

internals.dependencies = ['User'];

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

internals.register = function (model, next) {

    server = model.server;
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
        date: {
            type: Date,
            default: function () {
                return new Date();
            }
        },
        timestamp: {
            type: Number,
            default: Date.now
        },
        published: {
            type: Boolean,
            default: false,
            index: true
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

    Post.hasAndBelongsToMany('authors', {
        model: models.User
    });

    Post.getAll = function (fields, options, callback) {
        fields = fields || [];
        options = options || {};

        this.all({
            include: fields
        }, function (err, results) {

            if (err) {
                return callback(err);
            }

            if (options.toJSON) {

                var resultJSON, relations;
                results.forEach(function (result, index) {
                    relations = result.__cachedRelations;
                    resultJSON = result.toJSON();
                    resultJSON = _.extend(resultJSON, relations);
                    results[index] = resultJSON;
                });
            }

            callback(err, results);
        });
    };

    Post.afterCreate = function (next) {

        var self = this;

        if (config.hooks['post.created']) {

            internals._enqueue('post.created', {
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

    Post.beforeUpdate = function (next, data) {

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

    Post.afterUpdate = function (next) {

        var self = this;

        // Private data
        var _data = this.__data;

        if (!this.queue && _data.clearQueue !== true) {

            if (config.hooks['post.updated'] || config.hooks['post.deleted']) {

                internals._enqueue(this.deleted ? 'post.deleted' : 'post.updated', {
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

    Post.beforeDestroy = function (next) {

        if (config.hooks['post.destroyed']) {

            internals._enqueue('post.destroyed', {
                type: this.constructor.modelName,
                id: this.id
            }, false, function (err) {

                next(err);
            });
        }
    };

    models.Post = Post;

    next();
};

exports.dependencies = internals.dependencies;
exports.register = internals.register;

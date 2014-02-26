var Hapi = require('hapi');
var Utils = Hapi.utils;
var Schema = require('jugglingdb').Schema;
var _ = require('lodash');

var Config = require('../config');

var internals = {};

internals.dependencies = ['User'];

internals.register = function (model, next) {

    var server = model.server;
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

    Post.prototype.getApiUrl = function () {

        var apiUrl = Config.urlFor('api', {
            api: {
                model: 'posts',
                version: 1,
                id: this.id
            }
        }, true);

        return apiUrl;
    };

    Post.afterCreate = function (next) {

        var self = this;

        var apiUrl = this.getApiUrl();

        var task = {
            type: 'post.created',
            data: {
                id: this.id,
                cleanup: true
            }
        };

        server.methods.snackQueue('createJob', task, function (err, result) {
            self.updateAttributes({
                    queue: result.endpoint
                },
                function (err) {
                    next(err);
                });
        });
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

            var apiUrl = this.getApiUrl();

            var task = {
                type: 'post.updated',
                data: {
                    id: this.id,
                    cleanup: true,
                    endpoint: apiUrl
                }
            };

            server.methods.snackQueue('createJob', task, function (err, result) {

                self.updateAttributes({
                        queue: result.endpoint
                    },
                    function (err) {
                        next(err);
                    });
            });

        } else {

            next();
        }
    };

    Post.beforeDestroy = function (next) {

        var task = {
            type: 'post.destroying',
            data: {
                id: this.id,
                cleanup: false
            }
        };

        server.methods.snackQueue('createJob', task, function (err, result) {
            next();
        });
    };

    models.Post = Post;

    next();
};

module.exports = internals;

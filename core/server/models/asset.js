var Schema = require('jugglingdb').Schema;
var Base = require('./base');

var internals = {};

internals.dependencies = ['Base'];

internals.init = function (model, next) {

    var Snack = model.snack;
    var hooks = Snack.config().hooks;

    var schema = model.schema;
    var models = model.models;

    var Asset = schema.define('Asset', {
        id: {
            type: String,
            index: true
        },
        type: {
            type: String,
            default: 'file'
        },
        etag: {
            type: String,
            default: null
        },
        filename: String,
        mimetype: String,
        bytes: Number,
        storage: {
            type: String,
            default: 'local'
        },
        key: {
            type: String,
            length: 2000
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
        available: {
            type: Boolean,
            default: true,
            index: true
        },
        title: {
            type: String,
            length: 255
        },
        description: {
            type: Schema.Text
        },
        timestamp: {
            type: Number,
            default: Date.now,
            index: true
        },
        data: {
            type: {},
            default: null
        },
        queue: {
            type: String,
            length: 2000,
            default: null
        }
    });

    Asset.beforeCreate = function (next, data) {

        var mimeRegex = /^([a-z]+)\//;
        var mimeType = this.mimetype;

        // Get a more useful, human type from the mimetype.
        if (mimeType && mimeRegex.test(mimeType)) {
            data.type = mimeType.match(mimeRegex)[1];
        }

        next();
    };

    Asset.beforeUpdate = function (next, data) {

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

    Asset.afterUpdate = function (next) {

        var self = this;

        // Private data
        var _data = this.__data;

        if (!this.queue && _data.clearQueue !== true) {

            if (hooks['asset.updated']) {

                var queueItem = {
                    type: this.constructor.modelName,
                    id: this.id,
                    cleanup: true
                };

                Base.enqueue('asset.updated', queueItem, function (err, queued) {

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

    Asset.afterCreate = function (next) {

        var self = this;

        if (hooks['asset.created']) {

            var queueItem = {
                type: this.constructor.modelName,
                id: this.id,
                cleanup: true
            };

            Base.enqueue('asset.created', queueItem, function (err, queued) {

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

    Asset.beforeDestroy = function (next) {

        if (hooks['asset.destroyed']) {

            var queueItem = {
                type: this.constructor.modelName,
                id: this.id,
                obj: this
            };

            Base.enqueue('asset.destroyed', queueItem, function (err, queued) {

                queued.start();
                next(err);
            });
        }
    };

    models.Asset = Asset;

    next();
};

exports.dependencies = internals.dependencies;
exports.init = internals.init;

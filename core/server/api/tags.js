var Async = require('async');
var Hapi = require('hapi');
var Utils = Hapi.utils;
var Boom = Hapi.boom;

var internals = {};

internals.Tags = function (options) {

    this.server = options.server;
    this.models = options.models.models;
    this.config = options.config;
    this.api = options.api;
    this.hooks = options.config().hooks;
};

internals.Tags.prototype.list = function (args, done) {

    var Models = this.models;

    Models.Tag.all(function (err, tags) {

        done(err, err ? null : tags);
    });
};

internals.Tags.prototype.create = function (args, done) {

    var self = this;
    var Models = this.models;
    var Api = this.api;

    var payload = args.payload;

    var multi = true,
        tags = [],
        tag,
        items = [];

    // Can create 1 or many tags at once.
    if (payload.items) {

        items = payload.items;

    } else {

        items.push(payload);
        multi = false;
    }

    Async.eachSeries(items, function (item, next) {

            tag = new Models.Tag(item);

            tag.save(function (err, t) {
                if (err) return next(err);

                tags.push(t);
                next();
            });
        },
        function (err) {
            if (err) return done(err);

            Api.Base.enqueue(tags, 'tag.created', function (err) {
                if (err) return done(err);

                done(err, multi ? tags : tags[0]);
            });
        });
};

internals.Tags.prototype.read = function (args, done) {

    var Models = this.models,
        Api = this.api;

    var get = Api.Base.readParams(args);

    if (!get) {

        return done(Boom.badRequest());
    }

    Models.Tag[get.method](get.params, function (err, tag) {

        if (err) return done(err);

        if (!tag) {
            return done(Boom.notFound());
        }

        done(err, tag);
    });
};

internals.Tags.prototype.update = function (args, done) {

    var Api = this.api;
    var Models = this.models;

    var query = args.query;
    var params = args.params;
    var payload = args.payload;

    var clearQueue = false;
    if (query.clearQueue === 'true') {
        clearQueue = true;
    }

    Models.Tag.find(params.id, function (err, tag) {

        if (err) return done(err);

        if (!tag) {
            return done(Boom.notFound());
        }

        if (payload.timestamp) {

            // Timestamp versioning in effect, compare
            if (tag.timestamp !== payload.timestamp) {
                return done(Boom.conflict());
            }
        }

        if (tag.queue && clearQueue) {

            // Pass in the private queue clearing flag
            tag.__data.clearQueue = clearQueue;
        }

        tag.updateAttributes(payload, function (err, tag) {

            if (!tag.queue && !clearQueue) {

                Api.Base.enqueue(tag, 'tag.updated', function (err) {

                    if (err) return done(err);

                    done(err, tag ? tag : null);
                });

            } else {

                done(err, tag ? tag : null);
            }
        });
    });
};

internals.Tags.prototype.destroy = function (args, done) {

    var Models = this.models;
    var Api = this.api;

    var query = args.query;
    var params = args.params;

    Models.Tag.find(params.id, function (err, tag) {

        if (err) return done(err);

        if (!tag) {
            return done(Boom.notFound());
        }

        if (query.destroy === 'true') {

            // A true destructive delete
            tag.destroy(function (err) {
                Api.Base.enqueue(tag, 'tag.destroyed', function (err) {
                    var results = {
                        message: 'Destroyed'
                    };
                    done(err, results);
                });
            });

        } else {

            // Soft delete by default
            tag.updateAttributes({
                deleted: true
            }, function (err) {
                Api.Base.enqueue(tag, 'tag.deleted', function (err) {
                    var results = {
                        message: 'Deleted'
                    };
                    done(err, results);
                });
            });
        }
    });
};

module.exports = function (root) {

    var tags = new internals.Tags(root);
    return tags;
};

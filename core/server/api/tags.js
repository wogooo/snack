var Async = require('async');

var Base = require('./base');

var internals = {};

internals.Tags = function (options) {

    this.server = options.server;
    this.models = options.models.models;
    this.storage = options.storage;
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

    var Models = this.models;

    var query = args.query;
    var params = args.params;

    var method = 'find';
    var idOrMethod = params.idOrMethod;

    if (idOrMethod === 'bykey' && query.key) {

        // tag api accepts either UUIDs or keys
        method = 'findOne';
        query = {
            where: {
                key: query.key
            }
        };

    } else if (internals.isUUID(idOrMethod)) {

        query = id;

    } else {

        return done(new Error('Ivalid request.'));
    }

    Models.Tag[method](query, function (err, tag) {

        if (err) return done(err);

        if (!tag) {
            return done(new Error('Not found.'));
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
            return done(new Error('Record not found.'));
        }

        if (payload.timestamp) {

            // Timestamp versioning in effect, compare
            if (tag.timestamp !== payload.timestamp) {
                return done(new Error('Version mismatch.'));
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
            return done(new Error('Record not found.'));
        }

        if (query.destroy === 'true') {

            // A true destructive delete
            tag.destroy(function (err) {
                Api.Base.enqueue(tag, 'tag.destroyed', function (err) {
                    done(err);
                });
            });

        } else {

            // Soft delete by default
            tag.updateAttributes({
                deleted: true
            }, function (err) {
                Api.Base.enqueue(tag, 'tag.deleted', function (err) {
                    done(err);
                });
            });
        }
    });
};

internals.isUUID = function (str) {

    var pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return pattern.test(str);
};

module.exports = function (root) {

    var tags = new internals.Tags(root);
    return tags;
};

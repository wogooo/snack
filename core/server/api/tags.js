var Async = require('async');
var Hapi = require('hapi');
var Utils = Hapi.utils;

var internals = {};

internals.Tags = function (options) {

    this.server = options.server;
    this.models = options.models;
    this.config = options.config;
    this.api = options.api;
    this.hooks = options.config().hooks;
};

internals.Tags.prototype.list = function (args, done) {

    var Models = this.models,
        Api = this.api,
        query = args.query,
        options = query,
        list;

    var get = Api.Base.listParams(options);

    Models.Tag.all(get, function (err, tags) {

        list = {
            type: 'tagList',
            sort: get.order.split(' ')[1].toLowerCase(),
            order: get.order.split(' ')[0],
            offset: get.skip,
            limit: get.limit,
            count: tags.length,
            items: tags
        };

        done(err, err ? null : list);
    });
};

internals.Tags.prototype.create = function (args, done) {

    var self = this;

    var Models = this.models,
        Api = this.api,
        payload = args.payload || {},
        query = args.query || {},
        implicit = (query.implicit === true);

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

            tag.isValid(function (valid) {

                // implicit creation shouldn't return
                // validation errors.
                if (!valid && implicit) return done();

                tag.save(function (err, t) {
                    if (err) return next(err);

                    tags.push(t);
                    next();
                });
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

        return done(Hapi.error.badRequest());
    }

    Models.Tag[get.method](get.params, function (err, tag) {

        if (err) return done(err);

        if (!tag) {
            return done(Hapi.error.notFound());
        }

        done(err, tag);
    });
};

internals.Tags.prototype.edit = function (args, done) {

    var Models = this.models,
        Api = this.api,
        query = args.query,
        params = args.params,
        payload = args.payload,
        clearQueue = false,
        jobId;

    if (query.clearQueue) {
        clearQueue = true;
        jobId = parseInt(query.clearQueue, 10);
    }

    Models.Tag.find(params.id, function (err, tag) {

        if (err) return done(err);

        if (!tag) {
            return done(Hapi.error.notFound());
        }

        // Simple version control
        if (query.version && tag._version_ !== query.version) {

            // Return conflict if version (timestamp) doesn't match
            return done(Hapi.error.conflict());
        }

        if (clearQueue) {

            // Pass in the private queue clearing flag
            tag.__data.clearQueue = jobId;
        }

        tag.updateAttributes(payload, function (err, tag) {

            if (!clearQueue) {

                Api.Base.processRelations(tag, payload, function (err) {
                    Api.Base.enqueue(tag, 'tag.updated', function (err) {
                        done(err, !err ? tag : null);
                    });
                });

            } else {

                done(err, !err ? tag : null);
            }
        });
    });
};

internals.Tags.prototype.remove = function (args, done) {

    var Models = this.models;
    var Api = this.api;

    var query = args.query;
    var params = args.params;

    Models.Tag.find(params.id, function (err, tag) {

        if (err) return done(err);

        if (!tag) {
            return done(Hapi.error.notFound());
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

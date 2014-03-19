var Async = require('async');
var Hapi = require('hapi');
var Utils = Hapi.utils;
var Boom = Hapi.boom;

function Posts(options) {

    this.models = options.snack.models.models;
    this.api = options.api;
}

Posts.prototype.list = function (args, done) {

    var Models = this.models,
        Api = this.api,
        query = args.query,
        list;

    var get = Api.Base.listParams(query);

    Models.Post.all(get, function (err, posts) {

        if (err) return done(err);

        list = {
            type: 'postList',
            sort: get.order.split(' ')[1].toLowerCase(),
            order: get.order.split(' ')[0],
            offset: get.skip,
            limit: get.limit,
            count: posts.length,
            items: posts
        };

        done(null, list);
    });
};

Posts.prototype.create = function (args, done) {

    var Models = this.models;
    var Api = this.api;

    var payload = args.payload;

    var post = new Models.Post(payload);

    post.save(function (err) {

        if (err) return done(err);

        Api.Base.processRelations(post, null, function (err) {

            Api.Base.enqueue(post, 'post.created', function (err) {

                done(err, post);
            });
        });
    });
};

Posts.prototype.read = function (args, done) {

    var Models = this.models,
        Api = this.api;

    var get = Api.Base.readParams(args);

    if (!get) {

        return done(Boom.badRequest());
    }

    Models.Post[get.method](get.params, function (err, post) {

        if (err) return done(err);

        if (!post) return done(Boom.notFound());

        Api.Base.loadRelations(post, function (err) {

            if (err) return done(err);

            done(null, post);
        });
    });
};

Posts.prototype.update = function (args, done) {

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

    if (payload) {
        var priv = /^_\w+_$/;
        for (var p in payload) {
            if (p.match(priv)) {
                delete payload[p];
            }
        }
    }


    Models.Post.find(params.id, function (err, post) {
        if (err) return done(err);

        if (!post) return done(Boom.notFound());

        // Simple version control
        if (query.version && post._version_ !== query.version) {

            // Return conflict if version (timestamp) doesn't match
            return done(Boom.conflict());
        }

        // Clearing the queue property
        if (clearQueue) {

            // Pass in the private queue job id
            post.__data.clearQueue = jobId;
        }

        post.updateAttributes(payload, function (err) {

            if (!clearQueue) {

                Api.Base.processRelations(post, payload, function (err) {

                    Api.Base.enqueue(post, 'post.updated', function (err) {

                        Api.Base.loadRelations(post, function (err) {

                            done(err, !err ? post : null);
                        });
                    });
                });

            } else {

                done(err, !err ? post : null);
            }
        });
    });
};

Posts.prototype.destroy = function (args, done) {

    var Models = this.models;
    var Api = this.api;

    var query = args.query;
    var params = args.params;

    Models.Posts.find(params.id, function (err, post) {

        if (err) return done(err);

        if (!post) return done(Boom.notFound());

        if (query.destroy === 'true') {

            // A true destructive delete
            post.destroy(function (err) {
                Api.Base.enqueue(post, 'post.destroyed', function (err) {
                    done(err);
                });
            });

        } else {

            // Soft delete by default
            post.updateAttributes({
                deleted: true
            }, function (err) {
                Api.Base.enqueue(post, 'post.deleted', function (err) {
                    done(err);
                });
            });
        }
    });
};

module.exports = function (root) {

    var posts = new Posts(root);
    return posts;
};

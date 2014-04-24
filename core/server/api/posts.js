var Async = require('async');
var Hapi = require('hapi');
var Hoek = require('hoek');

function Posts(options) {

    this.models = options.snack.models;
    this.permission = options.snack.permissions.check;
    this.api = options.api;
}

Posts.prototype.list = function (args, done) {

    var Models = this.models,
        Api = this.api,
        query = args.query,
        options = query,
        list;

    options.modelName = 'Post';

    // Filter out anything pending
    options.filters = {
        '_pending_': false,
        '_deleted_': false
    };

    if (!args.user) {
        options.filters.availableAt = {
            lte: new Date()
        };
    }

    var get = Api.base.listParams(options);
    var where = Hoek.clone(get.where);

    Models.Post.all(get, function (err, posts) {

        if (err) return done(err);

        Models.Post.count(where, function (err, count) {

            if (err) return done(err);

            list = {
                type: 'postList',
                sort: get.order.split(' ')[1].toLowerCase(),
                order: get.order.split(' ')[0],
                offset: get.skip,
                limit: get.limit,
                total: count,
                count: posts ? posts.length : 0,
                items: posts || []
            };

            done(null, list);
        });
    });
};

Posts.prototype.create = function (args, done) {

    if (!args.user) {
        return done(Hapi.error.unauthorized('You must be logged in to edit'));
    }

    var Models = this.models,
        Api = this.api,
        Permission = this.permission,
        user = args.user,
        query = args.query,
        payload = args.payload,
        post;

    var canUser = Permission(user);

    canUser.create.Post(null, function (err, permitted) {

        if (!permitted) return done(Hapi.error.unauthorized('Insufficient privileges'));

        post = new Models.Post(payload);

        if (query.pending === 'true') {
            post._pending_ = true;
        }

        post.__data.user = user;

        post.save(function (err) {

            if (err) return done(err);

            if (post._pending_) {

                done(err, err ? null : post);

            } else {

                Api.base.processRelations(post, null, function (err) {
                    Api.base.enqueue(post, 'post.created', function (err) {
                        done(err, err ? null : post);
                    });
                });
            }
        });
    });
};

Posts.prototype.read = function (args, done) {

    var Models = this.models,
        Api = this.api;

    var get = Api.base.readParams(args);

    if (!get) {

        return done(Hapi.error.badRequest());
    }

    Models.Post[get.method](get.params, function (err, post) {

        if (err) return done(Hapi.error.badImplementation(err.message));
        if (!post) return done(Hapi.error.notFound());

        Api.base.loadRelations(post, get.relations, function (err) {
            done(err, err ? null : post);
        });
    });
};

Posts.prototype.edit = function (args, done) {

    if (!args.user) {
        return done(Hapi.error.unauthorized('You must be logged in to edit'));
    }

    var Models = this.models,
        Api = this.api,
        Permission = this.permission,
        query = args.query,
        params = args.params,
        user = args.user,
        payload = args.payload,
        clearQueue = false,
        created = false,
        hook,
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

    var canUser = Permission(user);

    canUser.edit.Post(params.id, function (err, permitted) {

        if (!permitted) return done(Hapi.error.unauthorized('Insufficient privileges'));

        Models.Post.find(params.id, function (err, post) {

            if (err) return done(Hapi.error.badImplementation(err.message));

            if (!post) return done(Hapi.error.notFound());

            // Simple version control
            if (query.version && post._version_ !== query.version) {

                // Return conflict if version (timestamp) doesn't match
                return done(Hapi.error.conflict());
            }

            // Clearing the queue property
            if (clearQueue) {

                // Pass in the private queue job id
                post.__data.clearQueue = jobId;
            }

            if (query.finalize === 'true' && post._pending_ === true) {
                payload._pending_ = false;
                created = true;
            }

            // Add the user object, for applying to update
            if (user) {
                post.__data.user = user;
            }

            post.updateAttributes(payload, function (err) {

                if (!clearQueue) {

                    hook = created ? 'post.created' : 'post.updated';

                    Api.base.processRelations(post, payload, function (err) {

                        Api.base.enqueue(post, hook, function (err) {

                            Api.base.loadRelations(post, null, function (err) {

                                done(err, err ? null : post);
                            });
                        });
                    });

                } else {

                    done(err, err ? null : post);
                }
            });
        });
    });
};

Posts.prototype.remove = function (args, done) {

    var Models = this.models;
    var Api = this.api;

    var query = args.query;
    var params = args.params;

    Models.Posts.find(params.id, function (err, post) {

        if (err) return done(err);

        if (!post) return done(Hapi.error.notFound());

        if (query.destroy === 'true') {

            // A true destructive delete
            post.destroy(function (err) {
                Api.base.enqueue(post, 'post.destroyed', function (err) {
                    done(err);
                });
            });

        } else {

            // Soft delete by default
            post.updateAttributes({
                _deleted_: true
            }, function (err) {
                Api.base.enqueue(post, 'post.deleted', function (err) {
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

var Async = require('async');

var internals = {};

internals.Posts = function (options) {

    this.models = options.snack.models.models;
    this.api = options.api;
};

internals.Posts.prototype.list = function list(args, done) {

    var Asests = this.api.Assets;
    var Models = this.models;

    var postList = {
        type: 'postList',
        count: 0,
        items: null
    };

    var query = args.query,
        params = {};

    if (query) {

        if (query.ids) {
            params.where = {};
            params.where.id = {};
            params.where.id.inq = query.ids.split(',');
        }

        if (query.order) {
            params.order = query.order;
        }

        if (query.offset) {
            params.skip = +query.offset;
        }

        if (query.limit) {
            params.limit = +query.limit;
        }
    }

    params.include = ['assets'];

    Models.Post.all(params, function (err, posts) {
        if (err) {
            return done(err);
        }

        postList.count = posts.length;

        if (postList.count) {
            postList.items = [];
            posts.forEach(function (post) {
                postList.items.push(post.toJSON());
            });
        }

        done(null, postList);
    });
};

internals.Posts.prototype.create = function (args, done) {

    var Models = this.models;
    var Api = this.api;

    var payload = args.payload;

console.log(args.payload);

    var post = new Models.Post(payload);

    post.save(function (err) {

        if (err) {
            return done(err);
        }

        Api.Base.processRelations(post, payload, function (err) {

            Api.Base.enqueue(post, 'post.created', function (err) {

                done(err, post);
            });
        });
    });
};

internals.Posts.prototype.read = function (args, done) {

    var Api = this.api;
    var Models = this.models;
    var relationInfo = Api.Base.getRelationInfo(Models.Post.modelName);
    var relationNames = Object.keys(relationInfo);

    var params = args.params;

    Models.Post.find(params.id, function (err, post) {

        if (err) {
            return done(err);
        }

        if (!post) {
            return done(new Error('Not found!'));
        }

        Async.eachSeries(relationNames, function (relationName, next) {

                post[relationName](next);
            },
            function (err) {

                done(err, post);
            });
    });
};

internals.Posts.prototype.update = function update(args, done) {

    var Asests = this.api.Assets;
    var Models = this.models;

    var query = args.query;
    var params = args.params;
    var payload = args.payload;

    var assets;

    if (payload.assets) {

        assets = payload.assets;
        delete payload.assets;

        if (assets.items && !assets.items[0].id) {
            console.log('assets need to be handled.');
        }
    }

    Models.Post.find(params.id, function (err, post) {
        if (err) {
            return done(err);
        }

        if (!post) {
            return done(new Error('Record not found.'));
        }

        if (payload.timestamp) {

            // Timestamp versioning in effect, compare
            if (post.timestamp > params.timestamp) {
                return done(new Error('Version mismatch.'));
            }
        }

        if (query.clearQueue === 'true') {

            // Pass in the private queue clearing flag
            post.__data.clearQueue = true;
        }

        if (assets && assets.items) {

            Async.each(assets.items, function (item, next) {

                post.assets.add(item, function (err) {
                    next(err);
                });

            }, function (err) {

                post.updateAttributes(payload, function (err, results) {

                    done(err, results ? results.toJSON(true) : null);
                });
            });

        } else {

            post.updateAttributes(payload, function (err, results) {

                done(err, results ? results.toJSON(true) : null);
            });
        }

    });
};

// internals.Posts.prototype.update = function (args, done) {

//     var Api = this.api;
//     var Models = this.models;

//     var query = args.query;
//     var params = args.params;
//     var payload = args.payload;

//     var clearQueue = false;
//     if (query.clearQueue === 'true') {
//         clearQueue = true;
//     }

//     Models.Post.find(params.id, function (err, post) {

//         if (err) return done(err);

//         if (!post) {
//             return done(new Error('Record not found.'));
//         }

//         if (payload.timestamp) {

//             // Timestamp versioning in effect, compare
//             if (post.timestamp !== payload.timestamp) {
//                 return done(new Error('Version mismatch.'));
//             }
//         }

//         if (post.queue && clearQueue) {

//             // Pass in the private queue clearing flag
//             post.__data.clearQueue = clearQueue;
//         }

//         Async.each(relations, function (relation, next) {

//             },
//             function (err) {

//             });

//         if (assets && assets.length) {

//             Async.each(assets, function (asset, next) {

//                 post.assets.add(asset, function (err) {
//                     next(err);
//                 });

//             }, function (err) {

//                 post.updateAttributes(payload, function (err, results) {

//                     done(err, results ? results : null);
//                 });
//             });

//         } else {

//             post.updateAttributes(payload, function (err, results) {

//                 done(err, results ? results : null);
//             });
//         }

//         post.updateAttributes(payload, function (err, post) {

//             if (!post.queue && !clearQueue) {

//                 Api.Base.enqueue(post, 'post.updated', function (err) {

//                     if (err) return done(err);

//                     done(err, post ? post : null);
//                 });

//             } else {

//                 done(err, post ? post : null);
//             }
//         });
//     });
// };

internals.Posts.prototype.destroy = function (args, done) {

    var Models = this.models;
    var Api = this.api;

    var query = args.query;
    var params = args.params;

    Models.Posts.find(params.id, function (err, post) {

        if (err) return done(err);

        if (!post) {
            return done(new Error('Record not found.'));
        }

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

    var posts = new internals.Posts(root);
    return posts;
};

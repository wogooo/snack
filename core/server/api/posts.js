var Async = require('async');

var Assets = require('./assets');
var Models = require('../models').models;

var posts = {};

posts.list = function list(args, done) {

    var postList = {
        count: null,
        items: null
    };

    Models.Post.all(function (err, posts) {
        if (err) {
            return done(err);
        }

        postList.count = posts.length;
        postList.items = posts;

        done(null, postList);
    });
};

posts.create = function create(args, done) {

    var payload = args.payload;
    var assets;

    if (payload.assets) {

        assets = payload.assets;
        delete payload.assets;

        if (assets.items && !assets.items[0].id) {
            console.log('assets need to be handled.');
        }
    }

    var post = new Models.Post(payload);

    post.save(function (err, p) {

        if (err) {
            return done(err);
        }

        if (assets && assets.items) {
            Async.each(assets.items, function (item, next) {
                p.assets.add(item.id, function (err) {
                    next(err);
                });
            }, function (err) {

                done(null, p.toJSON(true));
            });
        } else {

            done(null, p.toJSON(true));
        }
    });
};

posts.read = function read(args, done) {

    var params = args.params;

    Models.Post.find(params.id, function (err, post) {
        if (err) {
            return done(err);
        }

        if (!post) {
            return done(new Error('Not found!'));
        }

        post.assets(function () {
            done(err, post.toJSON(true));
        });
    });
};

posts.update = function update(args, done) {

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

posts.destroy = function destroy(args, done) {

    var query = args.query;
    var params = args.params;

    Models.Post.find(params.id, function (err, post) {
        if (err) {
            return done(err);
        }

        if (!post) {
            return done(new Error('Record not found.'));
        }

        if (query.destroy === 'true') {

            // A true destructive delete
            post.destroy(function (err) {
                done(err);
            });

        } else {

            // A more commons setting of the deleted flag
            post.updateAttributes({
                deleted: true
            }, function (err) {
                done(err);
            });
        }
    });
};

module.exports = posts;

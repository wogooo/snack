var models = require('../models').models;

var posts = {};

posts.create = function create(args, done) {

    var payload = args.payload;

    var post = new models.Post(payload);

    post.save(function (err, p) {
        if (err) {
            return done(err);
        }

        done(null, p.toJSON(true));
    });
};

posts.read = function read(args, done) {

    var params = args.params;

    models.Post.find(params.id, function (err, post) {
        if (err) {
            return done(err);
        }

        if (!post) {
            return done(new Error('Not found!'));
        }

        done(err, post.toJSON(true));
    });
};

posts.update = function update(args, done) {

    var query = args.query;
    var params = args.params;
    var payload = args.payload;

    models.Post.find(params.id, function (err, post) {
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

        post.updateAttributes(payload, function (err, results) {
            done(err, results ? results.toJSON(true) : null);
        });
    });
};

posts.destroy = function destroy(args, done) {

    var params = args.params;

    models.Post.find(params.id, function (err, post) {
        if (err) {
            return done(err);
        }

        if (!post) {
            return done(new Error('Record not found.'));
        }

        post.destroy(function (err, results) {
            done(err, results ? results.toJSON(true) : null);
        });
    });
};

module.exports = posts;

var internals = {};

internals.dependencies = [ 'Post' ];

internals.register = function (model, next) {

    var server = model.server;
    var schema = model.schema;
    var models = model.models;

    var Asset = schema.define('Asset', {
        id: {
            type: String,
            index: true
        },
        url: {
            type: String,
            length: 2000
        }
    });

    var Post = models.Post;

    Post.hasAndBelongsToMany('assets');

    models.Asset = Asset;

    next();
};

module.exports = internals;

var internals = {};

internals.dependencies = [ 'Post' ];

internals.register = function (model, next) {

    var server = model.server;
    var schema = model.schema;
    var models = model.models;

    var Image = schema.define('Image', {
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

    Post.hasAndBelongsToMany('images');

    models.Image = Image;

    next();
};

module.exports = internals;

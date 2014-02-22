var model = {};

model.dependencies = [ 'Post' ];

model.register = function (schema, models, options, next) {

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

module.exports = model;

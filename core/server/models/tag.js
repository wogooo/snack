var Schema = require('jugglingdb').Schema;

var internals = {};

internals.dependencies = ['Base'];

internals.init = function (model, next) {

    var server = model.server;
    var schema = model.schema;
    var models = model.models;

    var Tag = schema.define('Tag', {
        id: {
            type: String,
            index: true
        },
        type: String,
        kind: String,
        name: String,
        slug: String,
        description: {
            type: Schema.Text
        },
        timestamp: {
            type: Number,
            default: Date.now,
            index: true
        },
        queue: {
            type: String,
            length: 2000,
            default: null
        }
    });

    models.Tag = Tag;

    next();
};

module.exports = internals;

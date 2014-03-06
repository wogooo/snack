var Schema = require('jugglingdb').Schema;

var internals = {};

internals.dependencies = ['Base'];

internals.init = function (model, next) {

    var server = model.server;
    var schema = model.schema;
    var models = model.models;

    var User = schema.define('User', {
        id: {
            type: String,
            index: true
        },
        displayName: {
            type: String,
            length: 255
        },
        name: {
            type: String,
            length: 255
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

    models.User = User;

    next();
};

module.exports = internals;

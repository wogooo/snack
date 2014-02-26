var Schema = require('jugglingdb').Schema;

var internals = {};

internals.dependencies = [];

internals.register = function (model, next) {

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
        }
    });

    models.User = User;

    next();
};

module.exports = internals;

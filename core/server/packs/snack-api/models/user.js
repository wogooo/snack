var Schema = require('jugglingdb').Schema;

var model = {};

model.dependencies = [];

model.register = function (schema, models, options, next) {

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

module.exports = model;

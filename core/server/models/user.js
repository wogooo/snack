var Hapi = require('hapi');
var Schema = require('jugglingdb').Schema;
var Uslug = require('uslug');
var Bcrypt = require('bcrypt');

var internals = {};

internals.name = 'User';

internals.relations = function (model, next) {

    var modelName = internals.name;
    var models = model.models;
    var Model = models[modelName];

    Model.hasMany('posts', {
        foreignKey: 'ownerId'
    });

    Model.hasMany('assets', {
        as: 'owner',
        model: models.Asset
    });

    Model.hasMany('pages', {
        as: 'owner',
        model: models.Page
    });

    next();
};

internals.definition = function () {

    var modelName = internals.name;

    return {
        id: {
            type: String,
            index: true
        },
        type: {
            type: String,
            length: 255,
            default: modelName.toLowerCase()
        },
        key: {
            index: true,
            type: String,
            length: 255
        },
        displayName: {
            type: String,
            length: 255
        },
        username: {
            index: true,
            type: String,
            length: 255
        },
        password: {
            type: String,
            length: 255
        },
        email: {
            index: true,
            type: String,
            length: 255
        },
        updatedAt: {
            index: true,
            type: Date
        },
        permissions: [],
        _version_: {
            type: Number
        },
        _queue_: {
            type: String,
            length: 2000,
            default: null
        }
    };
};

internals.register = function (model, next) {

    var server = model.server;
    var schema = model.schema;
    var models = model.models;

    var modelName = internals.name;
    var definition = internals.definition();

    var Model = schema.define(modelName, definition);

    Model.validatesPresenceOf('username', '_version_');

    Model.validatesUniquenessOf('username', {
        message: 'Username is not unique.'
    });

    Model.beforeValidate = function (next, data) {

        if (this.email && this.email.search(/.+@.+\..+/i) < 0) {
            next(Hapi.error.badRequest());
        }

        if (this.username && this.username.search(/@/) > -1) {
            next(Hapi.error.badRequest());
        }

        if (!this.key) {
            this.key = Uslug(this.username);
        }

        if (!this.displayName) {
            this.displayName = this.username;
        }

        // Want the updatedAt and version identical
        var now = Date.now();

        this._version_ = now;
        this.updatedAt = new Date(now).toJSON();

        next();
    };

    Model.beforeCreate = function (next, data) {

        var self = this;

        Bcrypt.genSalt(12, function (err, salt) {
            Bcrypt.hash(data.password, salt, function (err, hash) {
                data.password = hash;
                next(err);
            });
        });

    };

    Model.beforeUpdate = function (next, data) {

        var self = this;

        if (this.password !== this.password_was) {

            Bcrypt.genSalt(12, function (err, salt) {
                Bcrypt.hash(data.password, salt, function (err, hash) {
                    data.password = hash;
                    next(err);
                });
            });

        } else {

            next();
        }
    };

    model.expose(Model);
    model.after(internals.relations);

    next();
};

exports.name = internals.name;
exports.definition = internals.definition;
exports.register = internals.register;

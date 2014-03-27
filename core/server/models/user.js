var Hapi = require('hapi');
var Schema = require('jugglingdb').Schema;
var Uslug = require('uslug');
var Bcrypt = require('bcrypt');

var internals = {};

internals.modelName = 'User';

internals.relations = function (model, next) {

    var modelName = internals.modelName,
        models = model.models,
        Model = models[modelName];

    Model.hasMany('posts', {
        foreignKey: 'ownerId'
    });

    Model.hasMany('assets', {
        as: 'owner',
        model: models.Asset
    });

    Model.hasMany('permissions', {
        model: models.Permission
    });

    Model.hasMany('roles', {
        model: models.Role
    });

    Model.belongsTo(models.User, {
        as: '_createdBy'
    });

    Model.belongsTo(models.User, {
        as: '_updatedBy'
    });

    next();
};

internals.modelDefinition = function () {

    var modelName = internals.modelName;

    return {
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
        // 'active', 'disabled', locked', 'pending'
        status: {
            index: true,
            type: String,
            length: 255,
            default: 'pending'
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

internals.generatePasswordHash = function (password, done) {
    Bcrypt.genSalt(12, function (err, salt) {
        Bcrypt.hash(password, salt, function (err, hash) {
            done(err, hash);
        });
    });
}

internals.register = function (model, next) {

    var modelName = internals.modelName,
        Snack = model.snack,
        Config = Snack.config,
        schema = model.schema,
        definition = internals.modelDefinition();

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

        internals.generatePasswordHash(data.password, function (err, hash) {
            data.password = hash;
            next(err);
        });

    };

    Model.beforeUpdate = function (next, data) {

        var self = this;

        if (this.password !== this.password_was) {

            internals.generatePasswordHash(data.password, function (err, hash) {
                data.password = hash;
                next(err);
            });

        } else {

            next();
        }
    };

    Model.check = function (emailOrUsername, done) {

        var key,
            params = {
                where: {}
            };

        if (emailOrUsername.search(/@/) > -1) {
            key = 'email';
        } else {
            key = 'username';
        }

        params.where[key] = emailOrUsername;
        this.findOne(params, done);
    };

    model.expose(Model);
    model.after(internals.relations);

    next();
};

exports.name = internals.modelName;
exports.definition = internals.modelDefinition;
exports.register = internals.register;

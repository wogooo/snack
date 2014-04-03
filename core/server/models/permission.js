var Schema = require('jugglingdb').Schema;

var internals = {};

internals.modelName = 'Permission';

internals.modelDefinition = function () {

    var modelName = internals.modelName;

    return {
        id: String,
        type: {
            type: String,
            length: 255,
            default: modelName.toLowerCase()
        },
        name: {
            type: String,
            length: 255
        },
        action: {
            type: String,
            length: 255
        },
        actionFor: {
            type: String,
            length: 255
        },
        actionForId: String,
        createdAt: {
            type: Date,
            default: function () {
                return new Date();
            }
        },
        updatedAt: {
            type: Date,
            default: function () {
                return new Date();
            }
        }
    };
};

internals.relations = function (model, next) {

    var modelName = internals.modelName,
        models = model.models,
        Model = models[modelName];

    Model.hasAndBelongsToMany('users', {
        model: models.User
    });

    Model.hasAndBelongsToMany('roles', {
        model: models.Role
    });

    Model.belongsTo(models.User, {
        as: '_createdBy',
        foreignKey: 'createdById'
    });

    Model.belongsTo(models.User, {
        as: '_updatedBy',
        foreignKey: 'updatedById'
    });

    next();
};

internals.register = function (model, next) {

    var modelName = internals.modelName,
        Snack = model.snack,
        Config = Snack.config,
        schema = model.schema,
        definition = internals.modelDefinition();

    var Model = schema.define(modelName, definition);

    Model.validatesPresenceOf('action', 'actionFor');

    Model.beforeCreate = function (next, data) {

        if (!data.updatedById) {
            data.updatedById = data.createdById;
        }

        next();
    };

    model.expose(Model);
    model.after(internals.relations);

    next();
};

exports.register = internals.register;
exports.name = internals.modelName;
exports.definition = internals.modelDefinition;

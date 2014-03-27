var Schema = require('jugglingdb').Schema;

var internals = {};

internals.modelName = 'Role';

internals.modelDefinition = function () {

    var modelName = internals.modelName;

    return {
        'type': {
            type: String,
            length: 255,
            default: modelName.toLowerCase()
        },
        'name': {
            type: String,
            length: 255
        },
        'description': {
            type: Schema.Text
        },
        'createdAt': {
            type: Date,
            default: function () {
                return new Date();
            }
        },
        'updatedAt': {
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

    Model.hasMany('users', {
        model: models.User
    });

    Model.hasMany('permissions', {
        model: models.Permission
    });

    Model.belongsTo(models.User, {
        as: '_createdBy'
    });

    Model.belongsTo(models.User, {
        as: '_updatedBy'
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

    Model.validatesPresenceOf('name');

    Model.validatesUniquenessOf('name', {
        message: 'Role name is not unique.'
    });

    model.expose(Model);
    model.after(internals.relations);

    next();
};

exports.register = internals.register;
exports.name = internals.modelName;
exports.definition = internals.modelDefinition;

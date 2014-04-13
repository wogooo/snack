var Schema = require('jugglingdb').Schema;

var internals = {};

internals.modelName = 'Setting';

internals.modelDefinition = function () {

    var modelName = internals.modelName;

    return {
        id: String,
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
        value: {
            type: String,
            length: 255
        },
        group: {
            type: String,
            length: 255
        },
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

    Model.validatesPresenceOf('key');

    Model.validatesUniquenessOf('key', {
        message: 'Setting key is not unique.'
    });

    Model.beforeCreate = function (next, data) {

        if (!data.updatedById) {
            data.updatedById = data.createdById;
        }

        next();
    };

    Model.findBy = function (key, val, done) {

        var find = {
            where: {}
        };

        find[key] = val;

        Model.findOne(find, done);
    };

    model.expose(Model);
    model.after(internals.relations);

    next();
};

exports.register = internals.register;
exports.name = internals.modelName;
exports.definition = internals.modelDefinition;

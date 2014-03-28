var Schema = require('jugglingdb').Schema;

var internals = {};

internals.modelName = 'Author';

internals.modelDefinition = function () {

    var modelName = internals.modelName;

    return {
        'type': {
            type: String,
            length: 255,
            default: modelName.toLowerCase()
        },
        'key': {
            index: true,
            type: String,
            length: 255
        },
        'name': {
            type: String,
            length: 255
        },
        'email': {
            type: String,
            length: 2000
        },
        'website': {
            type: String,
            length: 255
        },
        'bio': {
            type: Schema.Text
        },
        'bioShort': {
            type: String,
            length: 200
        },
        'location': {
            type: String
        },
        'deleted': {
            index: true,
            type: Boolean,
            default: false
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

    Model.belongsTo('owner', {
        model: models.User
    });

    Model.hasAndBelongsToMany('tags', {
        model: models.Tag
    });

    Model.hasAndBelongsToMany('assets', {
        model: models.Asset
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

    Model.validatesPresenceOf('name');

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

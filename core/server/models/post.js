var Hapi = require('hapi');
var Utils = Hapi.utils;
var HtmlStrip = require('htmlstrip-native').html_strip;
var Schema = require('jugglingdb').Schema;
var Uslug = require('uslug');
var Capitalize = require('inflection').capitalize;

var internals = {};

internals.modelName = 'Post';

internals.modelDefinition = function () {

    var modelName = internals.modelName;

    return {
        id: String,
        title: {
            type: String,
            length: 255
        },
        headline: {
            type: Schema.Text
        },
        key: {
            index: true,
            type: String,
            length: 255
        },
        type: {
            type: String,
            length: 255,
            default: modelName.toLowerCase()
        },
        kind: {
            index: true,
            type: String,
            length: 255,
            default: 'article'
        },
        body: {
            type: Schema.Text
        },
        language: String,
        page: {
            index: true,
            type: Boolean,
            default: false
        },
        createdAt: {
            index: true,
            type: Date,
            default: function () {
                return new Date();
            }
        },
        updatedAt: {
            index: true,
            type: Date
        },
        publishedAt: {
            index: true,
            type: Date,
            default: function () {
                return new Date();
            }
        },
        availableAt: {
            type: Date,
            default: function () {
                return new Date();
            }
        },
        deleted: {
            index: true,
            type: Boolean,
            default: false
        },

        // Private properties, wouldn't get copied
        // to a revision for instance.
        _queue_: [],
        _version_: Number,

        // Model has not been finalized yet, so `created` hook hasn't
        // been fired, shouldn't appear in indexes, etc.
        _pending_: {
            index: true,
            type: Boolean,
            default: false
        }
    };
};

internals.relations = function (model, next) {

    var modelName = internals.modelName;
    var models = model.models;
    var Model = models[modelName];

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

    var stripOpts = {
        'compact_whitespace': true
    };

    var Model = schema.define(modelName, definition);

    Model.validatesPresenceOf('_version_');

    // Key must be unqiue!
    // Model.validatesUniquenessOf('key', {
    //     message: 'Key is not unique.'
    // });

    // NOTE: For some reason setting values on `this` in beforeValidate only
    // affects new models. If the model already exists you need to set it on
    // `data`. This makes little sense...

    Model.beforeValidate = function (next, data) {

        // Private data
        var _data = this.__data,
            now = Date.now();

        if (!this.key) {

            // TODO: pass keys through config and allow patterns?
            this.key = Uslug(this.kind) + '/' + Uslug(this.title);
        }

        // Want the updatedAt and version identical
        this._version_ = now;
        this.updatedAt = new Date(now).toJSON();

        next();
    };

    Model.beforeCreate = function (next, data) {

        // Private data
        var _data = this.__data;

        if (_data.user) {
            data.ownerId = _data.user.id;
            data.createdById = _data.user.id;
            data.updatedById = _data.user.id;
        }

        if (data.headline) {
            data.title = HtmlStrip(data.headline, stripOpts).trim();
        }

        next();
    };

    Model.beforeUpdate = function (next, data) {

        // Private data
        var _data = this.__data;

        if (_data.clearQueue) {

            // Clearing the queue
            var jobId = _data.clearQueue;
            this._queue_.remove(jobId);
        }

        if (this._pending_ === true && this._pending__was === false) {

            // Pending boolean only goes from true to false, not
            // the other way.
            this._pending_ = false;
        }

        if (data.headline) {
            data.title = HtmlStrip(data.headline, stripOpts).trim();
        }

        if (_data.user) {
            data.updatedById = _data.user.id;
        }

        next();
    };

    Model.permissable = function (options, done) {

        var userPermissions = options.userPermissions,
            action = options.action,
            perm;

        for (var i in userPermissions) {
            perm = userPermissions[i];
            if (perm.action === action && Capitalize(perm.actionFor) === modelName) {
                return done(null, true);
            }
        }

        done(null, false);
    };

    model.expose(Model);
    model.after(internals.relations);

    next();
};

exports.name = internals.modelName;
exports.definition = internals.modelDefinition;
exports.register = internals.register;

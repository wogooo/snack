var Hoek = require('hoek');
var Util = require('util');
var Uslug = require('uslug');

var Helpers = require('../helpers').models;
var Base = require('./base');

var internals = {};

internals.modelName = 'Tag';

internals.relations = function (model, next) {

    var modelName = internals.modelName,
        models = model.models,
        Model = models[modelName];

    Model.hasMany(models.Alias, 'aliases', 'id', 'tagId');

    // Model.hasAndBelongsToMany(models.Post, 'posts', 'key', 'id');
    // Model.hasAndBelongsToMany(models.Asset, 'assets', 'key', 'id');

    // Model.belongsTo(models.User, 'createdBy', '_createdById', 'id');
    // Model.belongsTo(models.User, 'updatedBy', '_updatedById', 'id');

    next();
};

internals.register = function (model, next) {

    var Snack = model.snack,
        Enqueue = model.enqueue,
        thinky = Snack.services.thinky,
        r = thinky.r;

    var modelName = internals.modelName;

    var schema = {
        // Primary Key
        id: {
            _type: String,
            default: function () {
                return Uslug(this.kind || modelName.toLowerCase()) + '/' + Uslug(this.name);
            }
        },
        name: String,
        description: String,
        slug: {
            _type: String,
            default: function () {
                return Uslug(this.name);
            }
        },
        type: {
            _type: String,
            default: modelName.toLowerCase()
        },
        kind: {
            _type: String,
            default: modelName.toLowerCase()
        },
        createdAt: {
            _type: Date,
            default: new Date()
        },
        updatedAt: Date,
        _version_: Number,
        _queue_: {
            _type: Array,
            default: []
        }
    };

    var options = {
        init: true
    };

    var indexes = {
        'createdAt': true
    };

    var Model = thinky.createModel(modelName, schema, options);

    for (var index in indexes) {
        Model.ensureIndex(index);
    }

    Model._indexes = indexes;

    Model.docAddListener('saving', function (model) {

        // Version and updated timestamp
        var now = Date.now();
        model._version_ = now;
        model.updatedAt = new Date(now);

    });

    function getAlias(doc) {
        var aliases = doc.aliases,
            alias;

        if (aliases instanceof Array) {

            for (var a in aliases) {
                if (aliases[a].primary) {
                    alias = aliases[a];
                }
            }

            alias = alias || aliases[0] || {};

            return alias.key;
        }
    }

    Model.define('getAlias', function () {

        var aliases = this.aliases,
            alias;

        if (aliases instanceof Array) {

            for (var a in aliases) {
                if (aliases[a].primary) {
                    alias = aliases[a];
                }
            }

            alias = alias || aliases[0] || {};

            return alias.key;
        }
    });

    Model.define('enqueue', function (event) {

        return Enqueue.add(this, event);
    });

    Model.docAddListener('retrieved', function (doc) {

        // if (this.aliases) {
        //     this.alias = this.getAlias();
        // }
    });

    Helpers.extend(Model, Base);

    model.expose(Model);
    model.after(internals.relations);

    next();
};

// internals.register = function (model, next) {

//     var server = model.server;
//     var schema = model.schema;
//     var models = model.models;
//     var Config = model.config;

//     var Model = schema.define(modelName, {
//         id: String,
//         type: {
//             type: String,
//             length: 255,
//             default: modelName.toLowerCase()
//         },
//         kind: {
//             index: true,
//             type: String,
//             length: 255,
//             default: 'tag'
//         },
//         key: {
//             index: true,
//             type: String,
//             length: 2000
//         },
//         name: {
//             type: Schema.Text,
//             limit: 255
//         },
//         description: {
//             type: Schema.Text,
//             default: null
//         },
//         updatedAt: {
//             index: true,
//             type: Date
//         },
//         _version_: {
//             type: Number
//         },
//         _queue_: {
//             type: []
//         }
//     });

//     Model.validatesPresenceOf('name', 'key', '_version_');

//     // Key must be unqiue!
//     Model.validatesUniquenessOf('key', {
//         message: 'Key is not unique.'
//     });

//     Model.beforeValidate = function (next, data) {

//         if (!this.key) {

//             // Key is a little like S3 keys -- in some cases it
//             // would generate a path, but it also supports
//             // subgroupings of items that might otherwise have the
//             // same slug.
//             this.key = Uslug(this.kind) + '/' + Uslug(this.name);
//         }

//         // Want the updatedAt and version identical
//         var now = Date.now();

//         this._version_ = now;
//         this.updatedAt = new Date(now).toJSON();

//         next();
//     };

//     Model.beforeCreate = function (next, data) {

//         if (!data.updatedById) {
//             this.updatedById = data.createdById;
//         }

//         next();
//     };

//     Model.beforeUpdate = function (next, data) {

//         // Private data
//         var _data = this.__data;

//         if (_data.clearQueue) {

//             // Clearing the queue
//             var jobId = _data.clearQueue;
//             this._queue_.remove(jobId);
//         }

//         next();
//     };

//     Model.findBy = function (key, val, done) {

//         var find = {
//             where: {}
//         };

//         find[key] = val;

//         Model.findOne(find, done);
//     };

//     model.expose(Model);
//     model.after(internals.relations);

//     next();
// };

exports.register = internals.register;

var Promise = require('bluebird');

var Helpers = require('../helpers').models;
var Base = require('./base');

var internals = {};

internals.modelName = 'Alias';

internals.relations = function (model, next) {

    var modelName = internals.modelName,
        models = model.models,
        Model = models[modelName];

    // Model.belongsTo('post', {
    //     model: models.Post
    // });

    // Model.belongsTo('page', {
    //     model: models.Page
    // });

    // Model.belongsTo('profile', {
    //     model: models.Profile
    // });

    Model.belongsTo(models.Tag, 'doc', 'tagId', 'id');
    // Model.belongsTo(models.Post, 'doc, 'postId', 'id');
    // Model.belongsTo(models.Asset, 'doc, 'assetId', 'id');

    next();
};

internals.register = function (model, next) {

    var Snack = model.snack,
        thinky = Snack.services.thinky,
        r = thinky.r;

    var modelName = internals.modelName;

    var schema = {
        id: String,
        primary: {
            _type: Boolean,
            default: false
        },
        statusCode: {
            _type: Number,
            default: function () {
                return (this.primary ? 200 : 302);
            }
        },
        type: {
            _type: String,
            default: modelName.toLowerCase()
        },
        createdAt: {
            _type: Date,
            default: r.now()
        },
        updatedAt: Date,
        _version_: Number
    };

    var options = {
        init: true
    };

    var indexes = {
        'createdAt': true
    };

    var Alias = thinky.createModel(modelName, schema, options);

    Alias.ensureIndex('createdAt');

    for (var index in indexes) {
        Alias.ensureIndex(index);
    }

    Alias._indexes = indexes;

    Alias.docAddListener('saving', function (model) {

        // Version and updated timestamp
        var now = Date.now();
        model._version_ = now;
        model.updatedAt = new Date(now);

        if (model.primary) {
            model.statusCode = 200;
        } else {
            model.statusCode = 302;
        }
    });

    Alias.createUnique = function(base, extension) {

        var attempt = 0;

        function generateId() {
            var id = base;
            id += (attempt > 0) ? '-' + attempt : '';
            id += (extension) ? '.' + extension : '';
            return id;
        }

        var promise = new Promise(function (resolve, reject) {

            function saveAttempt() {

                var data = {
                    id: generateId()
                };

                Alias
                    .create(data)
                    .then(function (alias) {
                        resolve(alias);
                    })
                    .catch(function (err) {

                        if (err && err.code === 409 && attempt < 10) {
                            attempt++;
                            saveAttempt();
                        } else {
                            reject(err);
                        }
                    });
            }

            saveAttempt();
        });

        return promise;
    };

    Helpers.extend(Alias, Base);

    model.expose(Alias);
    model.after(internals.relations);

    next();
};

exports.register = internals.register;

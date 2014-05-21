var Helpers = require('../../helpers').models,
    Definition = require('./definition'),
    Base = require('../base');

var internals = {};

internals.relations = function (models, next) {

    var Models = models.models,
        Model = Models[Definition.name];

    Helpers.registerRelations(Models, Definition);

    Model.once('ready', function () {
        next();
    });
};

internals.register = function (models, next) {

    var pack = models.pack,
        snack = pack.app,
        thinky = snack.services.thinky,
        r = thinky.r;

    var Setting = Helpers.createModel(thinky, Definition, Base);

    Setting.docAddListener('saving', function (doc) {

        // Version and updated timestamp
        var now = Date.now();
        doc._version_ = now;
        doc.updatedAt = new Date(now);
    });

    models.after(internals.relations);

    Setting.once('ready', function (model) {

        models.expose(model);
        next();
    });
};

exports.register = internals.register;

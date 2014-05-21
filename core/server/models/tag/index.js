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
        enqueue = models.enqueue,
        thinky = snack.services.thinky,
        r = thinky.r;

    var Tag = Helpers.createModel(thinky, Definition, Base);

    Tag.docAddListener('saving', function (model) {

        // Version and updated timestamp
        var now = Date.now();
        model._version_ = now;
        model.updatedAt = new Date(now);
    });

    Tag.define('enqueue', function (event) {

        return enqueue.add(this, event);
    });

    Tag.addListener('retrieved', function (doc) {

    });

    models.after(internals.relations);

    Tag.once('ready', function (model) {

        models.expose(model);
        next();
    });
};

exports.register = internals.register;

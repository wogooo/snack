var Helpers = require('../../helpers').models,
    Slug = Helpers.generateSlug,
    HtmlStrip = require('htmlstrip-native').html_strip,
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
        thinky = snack.services.thinky;

    var Story = Helpers.createModel(thinky, Definition, Base);

    Story.docAddListener('saving', function (doc) {

        var was = doc.getOldValue() || {};

        // Version and updated timestamp
        var now = Date.now();
        doc._version_ = now;
        doc.updatedAt = new Date(now);

        if (doc.status === 'published' && (was.status === 'draft' || was.status === 'pending')) {
            doc.publishedAt = doc.publishedAt || new Date();
        }

        if (doc.headline) {
            doc.title = HtmlStrip(doc.headline).trim();
        }

        doc.slug = Slug(doc.title);
    });

    Story.define('enqueue', function (event) {

        return enqueue.add(this, event);
    });

    models.after(internals.relations);

    Story.once('ready', function (model) {

        models.expose(model);
        next();
    });
};

exports.register = internals.register;

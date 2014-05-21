var Path = require('path'),
    Promise = require('bluebird'),
    Helpers = require('../../helpers').models,
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
        config = snack.config,
        thinky = snack.services.thinky,
        r = thinky.r;

    var Alias = Helpers.createModel(thinky, Definition, Base);

    Alias.docAddListener('saving', function (alias) {

        // Version and updated timestamp
        var now = Date.now();
        alias._version_ = now;
        alias.updatedAt = new Date(now);

        if (alias.primary) {
            alias.statusCode = 200;
        } else {
            alias.statusCode = 302;
        }
    });

    Alias.createUnique = function(key) {

        var ext = Path.extname(key),
            bas = Path.basename(key, ext),
            dir = Path.dirname(key),
            base = Path.join(dir, bas);

        var attempt = 0,
            aliasKey = '';

        function generateAliasKey() {

            aliasKey = base;
            aliasKey += (attempt > 0) ? '-' + attempt : '';
            aliasKey += (ext) ? ext : '';

            return aliasKey;
        }

        var promise = new Promise(function (resolve, reject) {

            function saveAttempt() {

                var data = {
                    key: generateAliasKey()
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

    models.after(internals.relations);

    Alias.once('ready', function (model) {

        models.expose(model);
        next();
    });
};

exports.register = internals.register;

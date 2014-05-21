var Hapi = require('hapi'),
    Hoek = require('hoek'),
    Promise = require('bluebird'),
    Helpers = require('../helpers').api;

function Aliases(options) {

    this.models = options.models;
    this.config = options.config;
    this.api = options.api;
    this.check = options.snack.permissions.check;
}

Aliases.prototype.list = function (options, context, done) {

    var Alias = this.models.Alias;

    Alias
        .find(options)
        .then(function (aliasList) {
            done(null, aliasList);
        })
        .catch(function (err) {
            done(err);
        });
};

Aliases.prototype.read = function (options, context, done) {

    var Alias = this.models.Alias;

    Alias
        .findOne(options)
        .then(function (alias) {

            if (!alias) {
                return done(Hapi.error.notFound());
            }

            done(null, alias);
        })
        .catch(function (err) {

            done(err);
        });
};

Aliases.prototype.create = function (options, context, done) {

    var Alias = this.models.Alias;

    var data = options.payload;

    if (!data) {
        return done(Hapi.error.badRequest());
    }

    Alias
        .create(data)
        .then(function (alias) {

            done(null, alias);
        })
        .catch(function (err) {

            done(err);
        });
};

Aliases.prototype.edit = function (options, context, done) {

    var Alias = this.models.Alias,
        data = options.payload;

    Alias
        .update(data, options)
        .then(function (alias) {

            done(null, alias);
        })
        .catch(function (err) {

            done(err);
        });
};

Aliases.prototype.remove = function (options, context, done) {

    var Alias = this.models.Alias;

    // Aliases are always destroyed.
    Alias
        .destroy(options)
        .then(function()

            done(null, 'destroyed');
        })
        .catch(function (err) {

            done(err);
        });
};

module.exports = function (root) {

    return new Aliases(root);
};

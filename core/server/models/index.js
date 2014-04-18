var Hapi = require('hapi');
var Utils = require('hoek');
var Async = require('async');
var Schema = require('jugglingdb').Schema;

var internals = {};

internals.Models = function (options) {

    options = options || {};

    this._models = {};
    this._after = [];

    this.server = options.server;
    this.config = options.config;
    this.schema = options.schema;
};

internals.Models.prototype.register = function (names, done) {

    var self = this;

    var root = {};

    root.server = this.server;
    root.snack = this.server.app;
    root.config = this.config;
    root.schema = this.schema;
    root.models = this._models;

    root.expose = function (Model) {

        self._models[Model.modelName] = Model;
    };

    root.after = function (method) {

        self._after.push(method);
    };

    Async.eachSeries(names, function (modelName, next) {

        require(modelName).register(root, next);

    }, function (err) {

        Async.eachSeries(self._after, function (afterItem, next) {

            afterItem(root, next);

        }, function (err) {

            // TODO: There need to be dbInit / dbUpdate user events
            // that cause this to happen. Shouldn't be modifying
            // tables on every startup.

            // self.schema.autoupdate(function () {

                done(err, self._models);
            // });
        });
    });
};

internals.init = function (server, next) {

    var Snack = server.app;

    var config = {
        server: server,
        config: Snack.config,
        schema: Snack.services.schema
    };

    var models = new internals.Models(config);

    var modelNames = [
        './setting',
        './permission',
        './role',
        './user',
        './asset',
        './post',
        './tag'
    ];

    models.register(modelNames, function (err, _models) {

        Snack.models = _models;
        next(err);
    });
};

exports.init = internals.init;

var Hapi = require('hapi');
var Utils = Hapi.utils;
var Async = require('async');
var Schema = require('jugglingdb').Schema;

var internals = {};

internals.Models = function (options) {

    options = options || {};

    this._models = {};
    this._after = [];

    this.server = options.server;
    this.config = options.config;

    Utils.assert(options.db, 'Database configuration not defined!');

    this.schema = new Schema(options.db.engine, options.db);
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

            self.schema.autoupdate(function () {

                done(err, self._models);
            });
        });
    });
};

internals.init = function (server, next) {

    var Snack = server.app;

    var config = {
        server: server,
        config: Snack.config,
        db: Snack.config().db
    };

    var models = new internals.Models(config);

    var modelNames = [
        './asset',
        './page',
        './post',
        './tag',
        './user'
    ];

    models.register(modelNames, function (err, _models) {

        Snack.models = _models;
        next(err);
    });
};

exports.init = internals.init;

var Hapi = require('hapi'),
    Hoek = require('hoek'),
    Async = require('async');

var Helpers = require('../helpers').models;

var internals = {};

internals.Models = function (options) {

    options = options || {};

    this._models = {};
    this._after = [];

    this.pack = options.pack;
    this.server = options.server;
    this.config = options.config;
    this.schema = options.schema;
};

internals.Models.prototype.register = function (names, done) {

    var self = this;

    var root = {};

    root.pack = this.pack;
    root.snack = this.pack.app;
    root.config = this.config;
    root.models = this._models;
    root.enqueue = Helpers.enqueue(this.server);

    root.expose = function (Model) {

        var modelName;

        if (Model.getTableName) {
            modelName = Model.getTableName();

        } else {
            modelName = Model.modelName;
        }

        self._models[modelName] = Model;
    };

    root.after = function (method) {

        self._after.push(method);
    };

    Async.each(names, function (modelName, next) {

        require(modelName).register(root, next);

    }, function (err) {

        Async.each(self._after, function (afterItem, next) {

            afterItem(root, next);

        }, function (err) {

            done(err, self._models);
        });
    });
};

internals.init = function (server, next) {

    var Snack = server.app;

    var config = {
        server: server,
        pack: server.pack,
        config: Snack.config
    };

    var models = new internals.Models(config);

    var modelNames = [
        './setting',
        './alias',
        './permission',
        './role',
        './user',
        './asset',
        './story',
        './tag'
    ];

    models.register(modelNames, function (err, _models) {

        Snack.models = _models;

        next(err);
    });
};

exports.init = internals.init;

var Hapi = require('hapi');
var Utils = Hapi.utils;
var Async = require('async');
var Schema = require('jugglingdb').Schema;

var models = [
    './asset',
    './page',
    './post',
    './tag',
    './user'
];

var internals = {};

internals.init = function (server, callback) {

    var _after = [];

    var Config = server.app.config;

    var db = Config().db;
    var schema = new Schema(db.engine, db);

    var root = {};

    root.server = server;
    root.snack = server.app;
    root.config = server.app.config;
    root.schema = schema;
    root.models = exports;

    root.after = function (method) {

        _after.push(method);
    };

    Async.eachSeries(models, function (modelName, next) {

        require(modelName).register(root, next);

    }, function (err) {

        Async.eachSeries(_after, function (afterItem, next) {

            afterItem(root, next);

        }, function (err) {

            schema.autoupdate(function () {

                callback(err, root.models);
            });
        });
    });
};

exports.init = internals.init;

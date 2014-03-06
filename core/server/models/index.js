var Hapi = require('hapi');
var Utils = Hapi.utils;
var Async = require('async');
var Schema = require('jugglingdb').Schema;

var internals = {};

internals.loadOrder = function (models) {

    var model, deps;
    var lastDepIndex, depIndex;

    var loadOrderTemp;
    var loadOrder = [];

    for (var m in models) {

        model = models[m];
        deps = model.dependencies;

        if (deps) {

            lastDepIndex = -1;

            deps.forEach(function (dep) {

                depIndex = loadOrder.indexOf(dep);
                if (depIndex > lastDepIndex) {
                    lastDepIndex = depIndex;
                }
            });

            if (lastDepIndex > -1) {

                loadOrderTemp = loadOrder.splice(lastDepIndex + 1);
                loadOrder.push(m);
                loadOrder = loadOrder.concat(loadOrderTemp);

            } else {

                loadOrder.unshift(m);
            }

        } else {

            loadOrder.unshift(m);
        }
    }

    return loadOrder;
};

internals.init = function (server, callback) {

    var Snack = server.app;
    var Config = Snack.config;

    var db = Config().db;
    var schema = new Schema(db.engine, db);

    var requires = {};
    Utils.loadDirModules(__dirname, ['index', 'base'], requires);

    var loadOrder = internals.loadOrder(requires);

    var root = {};

    root.server = server;
    root.snack = Snack;
    root.models = exports.models;
    root.schema = schema;

    Async.eachSeries(loadOrder, function (loadItem, next) {

        requires[loadItem].init(root, next);

    }, function (err) {

        schema.autoupdate(function () {

            callback(err, exports.models);
        });
    });
};

exports.init = internals.init;
exports.models = {};

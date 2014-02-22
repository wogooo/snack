var path = require('path');
var utile = require('utile');
var async = utile.async;

var Schema = require('jugglingdb').Schema;

var internals = {};

internals.models = {};

internals.getModels = function () {
    return internals.models;
};

exports.getModels = internals.getModels;

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

                dep = dep.toLowerCase();
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

internals.load = function (settings, callback) {

    var db = settings.db;
    var schema = new Schema(db.engine, db);

    var requires = utile.requireDir(path.resolve(__dirname, '../models'));
    var loadOrder = internals.loadOrder(requires);

    var models = internals.models;

    async.eachSeries(loadOrder, function (loadItem, next) {

        requires[loadItem].register(schema, models, {}, next);

    }, function (err) {

        schema.autoupdate(function () {

            callback(err, models);
        });
    });
};

exports.load = internals.load;

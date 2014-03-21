var Async = require('async');
var Hapi = require('hapi');
var Utils = Hapi.utils;

var requires = {};

Utils.loadDirModules(__dirname, ['index'], requires);

exports.init = function (server, next) {

    var requireKeys = Object.keys(requires);

    var storage = {};

    storage.server = server;
    storage.snack = server.app;
    storage.hapi = Hapi;
    storage.exports = exports;

    Async.eachSeries(requireKeys, function (requireName, next) {

            requires[requireName](storage, next);
        },
        function (err) {

            next();
        });
};

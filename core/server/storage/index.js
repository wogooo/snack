var Async = require('async');
var Hapi = require('hapi');
var Utils = Hapi.utils;

var requires = [
    './local',
    './s3'
];

exports.init = function (server, next) {

    var provider = 'S3';

    var storage = {};

    storage.server = server;
    storage.snack = server.app;
    storage.hapi = Hapi;
    storage.providers = {};

    Async.eachSeries(requires, function (requireName, next) {

            require(requireName)(storage, next);
        },
        function (err) {

            exports.save = storage.providers[provider].save;
            exports.exists = storage.providers[provider].exists;
            exports.update = storage.providers[provider].update;
            exports.destroy = storage.providers[provider].destroy;

            next();
        });
};

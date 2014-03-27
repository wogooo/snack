var Async = require('async');
var Hapi = require('hapi');
var Utils = Hapi.utils;

var PROVIDER = 'S3';

var requires = [
    './local',
    './s3'
];

exports.init = function (server, next) {

    var Snack = server.app;

    var root = {};
    root.server = server;
    root.snack = Snack;
    root.hapi = Hapi;
    root.providers = {};

    Async.eachSeries(requires, function (requireName, next) {

            require(requireName)(root, next);
        },
        function (err) {

            Snack.storage = root.providers[PROVIDER];
            next();
        });
};

var Async = require('async');
var Hapi = require('hapi');
var Utils = Hapi.utils;

var internals = {};

exports.init = function (server, next) {

    var _extensions = {},
        Snack = server.app,
        root = {};

    root.server = server;

    root.expose = function (extensionName, extension) {

        _extensions[extensionName] = extension;
    };

    Async.eachSeries(extensions, function (extension, next) {

            require(extension).register(root, next);
        },
        function (err) {

            Snack.extensions = _extensions;
            next(err);
        });
};

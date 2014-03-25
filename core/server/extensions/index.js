var Hapi = require('hapi');
var Utils = Hapi.utils;

var internals = {};

exports.init = function (server, next) {

    server.ext('onPostHandler', function (request, extNext) {
        extNext();
    });

    next();
};

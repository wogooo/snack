var Hapi = require('hapi');
var Utils = require('hoek');

var Config = require('../config');

var internals = {};

internals.init = function (server, next) {

    var plugins = {};

    plugins['snack-queue'] = Config().queue;

    plugins.yar = {
        cookieOptions: {
            password: Config().secret,
            isSecure: false
        }
    };

    plugins.travelogue = {};
    plugins['hapi-auth-basic'] = {};
    plugins['hapi-auth-jwt'] = {};

    server.pack.require(plugins, next);
};

exports.init = internals.init;

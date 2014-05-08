var Path = require('path');

var Hapi = require('hapi');

var Config = require('../config');

var internals = {};

internals.init = function (server, next) {

    var Snack = server.app;
    var config = Snack.config();

    var plugins = {};

    plugins['snack-talk'] = {
        redis: config.redis
    };

    plugins['snack-queue'] = config.queue;

    plugins.yar = {
        cookieOptions: {
            password: config.secret,
            isSecure: false
        }
    };

    plugins.travelogue = {};
    plugins['hapi-auth-basic'] = {};
    plugins['hapi-auth-jwt'] = {};

    server.pack.require(plugins, next);
};

exports.init = internals.init;

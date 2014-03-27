var Hapi = require('hapi');
var Utils = Hapi.utils;

var Config = require('../config');

var internals = {};

internals.init = function (server, next) {

    var plugins = {};

    plugins['snack-queue'] = Config().queue;

    plugins.yar = {
        cookieOptions: {
            password: 'foo',
            isSecure: false
        }
    };

    plugins.travelogue = {
        urls: {
            failureRedirect: '/login',
            successRedirect: '/snack'
        }
    };

    server.pack.require(plugins, next);
};

exports.init = internals.init;

/*jshint sub:true*/

var Hapi = require('hapi');
var Utils = Hapi.utils;

var requires = {};

Utils.loadDirModules(__dirname, ['index'], requires);

exports.init = function (server, next) {

    var root = {};
    root.server = server;
    root.snack = server.app;
    root.config = server.app.config;

    Object.keys(requires).forEach(function (requireName) {
        requires[requireName](root);
    });

    next();
};

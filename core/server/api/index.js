var Hapi = require('hapi');
var Utils = Hapi.utils;

var requires = {};

Utils.loadDirModules(__dirname, ['index'], requires);

exports.init = function (server, next) {

    var Snack = server.app;

    var root = {};

    root.server = server;
    root.snack = server.app;
    root.config = server.app.config;
    root.models = server.app.models;
    root.storage = server.app.storage;

    root.api = {};

    Object.keys(requires).forEach(function (requireName) {
        root.api[requireName] = requires[requireName](root);
    });

    Snack.api = root.api;

    next();
};

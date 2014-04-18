var Hapi = require('hapi');
var Utils = require('hoek');

var requires = [
    'assets',
    'base',
    'posts',
    'tags',
    'users'
];

exports.init = function (server, next) {

    var Snack = server.app;

    var root = {};

    root.server = server;
    root.snack = server.app;
    root.config = server.app.config;
    root.models = server.app.models;
    root.storage = server.app.storage;

    root.api = {};

    requires.forEach(function (requireName) {
        root.api[requireName] = require('./' + requireName)(root);
    });

    Snack.api = root.api;

    next();
};

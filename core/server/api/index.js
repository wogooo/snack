var Hapi = require('hapi');
var Helpers = require('../helpers').api;

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

    Snack.api.requestHandler = function (collection, method, request, reply) {

        var options = Helpers.requestHandler(method, request) || {};
        var context = request;

        context.user = context.user || context.auth.credentials;

        Snack.api[collection][method](options, context, function (err, results) {
            reply(err ? err : results);
        });
    };

    next();
};

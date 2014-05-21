var Hapi = require('hapi'),
    Promise = require('bluebird'),
    Helpers = require('../helpers').api;

var requires = [
    // 'aliases',
    'assets',
    'files',
    'stories',
    'tags',
    'users'
];

exports.init = function (server, next) {

    var Snack = server.app,
        User = Snack.models.User;

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

        var options = Helpers.requestHandler(method, request) || {},
            credentials = request.user || request.auth.credentials,
            context = {},
            promise;

        if (credentials) {
            promise = User.get(credentials.id).run();
        } else {
            promise = Promise.resolve();
        }

        promise
            .then(function (user) {

                context.user = user;

                Snack.api[collection][method](options, context, function (err, results) {

                    if (err) return reply(err);

                    if (method === 'remove') {

                        if (results === 'destroyed') {
                            return reply().code(204);
                        }

                        return reply().code(202);
                    }

                    if (method === 'create' || method === 'store') {

                        return reply(results).code(201);
                    }

                    if (method === 'edit') {

                        return reply(results).code(202);
                    }

                    reply(results);
                });
            });
    };

    next();
};

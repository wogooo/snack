var Fs = require('fs');
var Path = require('path');
var Async = require('async');

module.exports = function (server) {

    var Snack = server.app;
    var Config = Snack.config;
    var Storage = Snack.storage;
    var Api = Snack.api;

    server.route({
        method: 'GET',
        path: '/api/v1/posts',
        handler: function (request, reply) {

            Api.Posts.list(request, function (err, results) {
                if (err) {
                    return reply({
                        error: err.name,
                        message: err.message
                    }).code(500);
                }

                reply(results);
            });
        }
    });

    server.route({
        method: 'POST',
        path: '/api/v1/posts',
        config: {
            payload: {
                output: 'file',
                parse: true
            },
            handler: function (request, reply) {

                Api.Posts.create(request, function (err, results) {
                    reply(results);
                });
            }
        }
    });

    server.route({
        method: 'PUT',
        path: '/api/v1/posts/{id}',
        handler: function (request, reply) {

            Api.Posts.update(request, function (err, results) {
                reply(results);
            });
        }
    });

    server.route({
        method: 'GET',
        path: '/api/v1/posts/{id}',
        handler: function (request, reply) {

            Api.Posts.read(request, function (err, results) {
                if (err) {
                    return reply({
                        error: err.name,
                        message: err.message
                    }).code(500);
                }

                reply(results);
            });
        }
    });

    server.route({
        method: 'DELETE',
        path: '/api/v1/posts/{id}',
        handler: function (request, reply) {

            Api.Posts.destroy(request, function (err, results) {
                reply(results);
            });
        }
    });

    server.route({
        method: 'GET',
        path: '/api/v1/assets',
        handler: function (request, reply) {

            Api.Assets.list(request, function (err, results) {
                if (err) {
                    return reply({
                        error: err.name,
                        message: err.message
                    }).code(500);
                }

                reply(results);
            });
        }
    });

    server.route({
        method: 'POST',
        path: '/api/v1/assets',
        config: {
            payload: {
                output: 'file',
                parse: true
            },
            handler: function (request, reply) {

                Api.Assets.create(request, function (err, results) {
                    if (err) {
                        return reply({
                            error: err.name,
                            message: err.message
                        }).code(500);
                    }

                    reply(results);
                });
            }
        }
    });

    server.route({
        method: 'GET',
        path: '/api/v1/assets/{id}',
        handler: function (request, reply) {

            Api.Assets.read(request, function (err, results) {
                if (err) {
                    return reply({
                        error: err.name,
                        message: err.message
                    }).code(500);
                }

                reply(results);
            });
        }
    });

    server.route({
        method: 'PUT',
        path: '/api/v1/assets/{id}',
        handler: function (request, reply) {

            Api.Assets.update(request, function (err, results) {
                reply(results);
            });
        }
    });

    server.route({
        method: 'DELETE',
        path: '/api/v1/assets/{id}',
        handler: function (request, reply) {

            Api.Assets.destroy(request, function (err, results) {

                if (err) {
                    return reply({
                        error: err.name,
                        message: err.message
                    }).code(500);
                }

                reply({
                    message: 'deleted'
                });
            });
        }
    });

    // server.route({
    //     method: 'GET',
    //     path: '/api/v1/posts',
    //     handler: function (request, reply) {

    //         models.Post.getAll(['assets', 'authors'], {
    //                 toJSON: true
    //             },
    //             function (err, results) {
    //                 reply(results);
    //             });
    //     }
    // });
};

var Fs = require('fs');
var Path = require('path');
var Async = require('async');

module.exports = function (route) {

    var server = route.server;
    var Snack = route.snack;
    var Config = route.config;

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

    server.route({
        method: 'POST',
        path: '/api/v1/tags',
        handler: function (request, reply) {

            Api.Tags.create(request, function (err, results) {
                if (err) {
                    var error = {
                        error: err.name,
                        message: err.message
                    };

                    return reply(error).code(500);
                }

                reply(results);
            });
        }
    });

    server.route({
        method: 'PUT',
        path: '/api/v1/tags/{id}',
        handler: function (request, reply) {

            Api.Tags.update(request, function (err, results) {
                if (err) {
                    var error = {
                        error: err.name,
                        message: err.message
                    };

                    return reply(error).code(500);
                }

                reply(results);
            });
        }
    });

    server.route({
        method: 'GET',
        path: '/api/v1/tags',
        handler: function (request, reply) {

            Api.Tags.list(request, function (err, results) {

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
        method: 'GET',
        path: '/api/v1/tags/{idOrMethod}',
        handler: function (request, reply) {

            Api.Tags.read(request, function (err, results) {
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

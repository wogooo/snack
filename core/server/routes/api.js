var Fs = require('fs');
var Path = require('path');
var Async = require('async');
var Hapi = require('hapi');
var Boom = Hapi.boom;

module.exports = function (route) {

    var server = route.server;
    var Snack = route.snack;
    var Config = route.config;

    var Api = Snack.api;

    // ----------------------
    // Posts

    server.route({
        method: 'GET',
        path: '/api/v1/posts',
        handler: function (request, reply) {

            Api.Posts.list(request, function (err, results) {
                reply(err ? err : results);
            });
        }
    });

    server.route({
        method: 'GET',
        path: '/api/v1/posts.json',
        handler: function (request, reply) {

            Api.Posts.list(request, function (err, results) {
                reply(err ? err : results);
            });
        }
    });

    server.route({
        method: 'POST',
        path: '/api/v1/posts',
        config: {
            payload: {
                output: 'file',
                parse: true,
                allow: 'multipart/form-data'
            },
            handler: function (request, reply) {

                Api.Posts.create(request, function (err, results) {
                    reply(err ? err : results);
                });
            }
        }
    });

    server.route({
        method: 'POST',
        path: '/api/v1/posts.json',
        config: {
            payload: {
                output: 'data',
                parse: true,
                allow: ['application/json', 'application/x-www-form-urlencoded']
            },
            handler: function (request, reply) {

                Api.Posts.create(request, function (err, results) {
                    reply(err ? err : results);
                });
            }
        }
    });

    server.route({
        method: 'PUT',
        path: '/api/v1/posts/{id}',
        config: {
            payload: {
                output: 'file',
                parse: true,
                allow: 'multipart/form-data'
            },
            handler: function (request, reply) {

                Api.Posts.update(request, function (err, results) {
                    reply(err ? err : results);
                });
            }
        }
    });

    server.route({
        method: 'PUT',
        path: '/api/v1/posts/{id}.json',
        config: {
            payload: {
                output: 'data',
                parse: true,
                allow: ['application/json', 'application/x-www-form-urlencoded']
            },
            handler: function (request, reply) {

                Api.Posts.update(request, function (err, results) {
                    reply(err ? err : results);
                });
            }
        }
    });

    server.route({
        method: 'GET',
        path: '/api/v1/posts/{id}',
        handler: function (request, reply) {

            Api.Posts.read(request, function (err, results) {
                reply(err ? err : results);
            });
        }
    });

    server.route({
        method: 'GET',
        path: '/api/v1/posts/{id}.json',
        handler: function (request, reply) {

            Api.Posts.read(request, function (err, results) {
                reply(err ? err : results);
            });
        }
    });

    server.route({
        method: 'DELETE',
        path: '/api/v1/posts/{id}',
        handler: function (request, reply) {

            Api.Posts.destroy(request, function (err, results) {
                reply(err ? err : results);
            });
        }
    });

    // ----------------------
    // Assets

    server.route({
        method: 'POST',
        path: '/api/v1/assets',
        config: {
            payload: {
                output: 'file',
                parse: true,
                allow: 'multipart/form-data'
            },
            handler: function (request, reply) {

                Api.Assets.create(request, function (err, results) {
                    reply(err ? err : results);
                });
            }
        }
    });

    server.route({
        method: 'POST',
        path: '/api/v1/assets.json',
        config: {
            payload: {
                output: 'data',
                parse: true
            },
            handler: function (request, reply) {

                Api.Assets.create(request, function (err, results) {
                    reply(err ? err : results);
                });
            }
        }
    });

    server.route({
        method: 'POST',
        path: '/api/v1/files',
        config: {
            payload: {
                output: 'stream',
                parse: true,
                allow: ['image/jpeg', 'image/png']
            },
            handler: function (request, reply) {

                Api.Assets.storeFile(request, function (err, results) {
                    reply(err ? err : results);
                });
            }
        }
    });

    server.route({
        method: 'PUT',
        path: '/api/v1/assets/{id}',
        config: {
            payload: {
                output: 'file',
                parse: true,
                allow: 'multipart/form-data'
            },
            handler: function (request, reply) {

                Api.Assets.update(request, function (err, results) {
                    reply(err ? err : results);
                });
            }
        }
    });

    server.route({
        method: 'PUT',
        path: '/api/v1/assets/{id}.json',
        config: {
            payload: {
                output: 'data',
                parse: true,
                allow: ['application/json', 'application/x-www-form-urlencoded']
            },
            handler: function (request, reply) {

                Api.Assets.update(request, function (err, results) {
                    reply(err ? err : results);
                });
            }
        }
    });

    server.route({
        method: 'DELETE',
        path: '/api/v1/assets/{id}',
        handler: function (request, reply) {

            Api.Assets.destroy(request, function (err) {
                reply(err ? err : results);
            });
        }
    });

    server.route({
        method: 'GET',
        path: '/api/v1/assets/{id}',
        handler: function (request, reply) {

            Api.Assets.read(request, function (err, results) {
                reply(err ? err : results);
            });
        }
    });

    server.route({
        method: 'GET',
        path: '/api/v1/assets/{id}.json',
        handler: function (request, reply) {

            Api.Assets.read(request, function (err, results) {
                reply(err ? err : results);
            });
        }
    });

    server.route({
        method: 'GET',
        path: '/api/v1/assets',
        handler: function (request, reply) {

            Api.Assets.list(request, function (err, results) {
                reply(err ? err : results);
            });
        }
    });

    server.route({
        method: 'GET',
        path: '/api/v1/assets.json',
        handler: function (request, reply) {

            Api.Assets.list(request, function (err, results) {
                reply(err ? err : results);
            });
        }
    });

    // ----------------------
    // Tags

    server.route({
        method: 'POST',
        path: '/api/v1/tags',
        handler: function (request, reply) {

            Api.Tags.create(request, function (err, results) {
                reply(err ? err : results);
            });
        }
    });

    server.route({
        method: 'PUT',
        path: '/api/v1/tags/{id}',
        handler: function (request, reply) {

            Api.Tags.update(request, function (err, results) {
                reply(err ? err : results);
            });
        }
    });

    server.route({
        method: 'GET',
        path: '/api/v1/tags',
        handler: function (request, reply) {

            Api.Tags.list(request, function (err, results) {
                reply(err ? err : results);
            });
        }
    });

    server.route({
        method: 'GET',
        path: '/api/v1/tags/{id}',
        handler: function (request, reply) {

            Api.Tags.read(request, function (err, results) {
                reply(err ? err : results);
            });
        }
    });

    server.route({
        method: 'DELETE',
        path: '/api/v1/tags/{id}',
        handler: function (request, reply) {

            Api.Tags.destroy(request, function (err, results) {
                reply(err ? err : results);
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

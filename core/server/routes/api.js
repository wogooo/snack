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
    var Auth = Snack.extensions.auth;

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

                Api.Posts.edit(request, function (err, results) {
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

                Api.Posts.edit(request, function (err, results) {
                    reply(err ? err : results);
                });
            }
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
        path: '/api/v1/posts/{id}.json',
        handler: function (request, reply) {

            Api.Posts.remove(request, function (err, results) {
                reply(err ? err : results);
            });
        }
    });

    // ----------------------
    // Assets

    // Handle multipart uploads
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

    // Handle JSON asset provisioning
    server.route({
        method: 'POST',
        path: '/api/v1/assets.json',
        config: {
            payload: {
                output: 'data',
                parse: true,
                allow: ['application/json', 'application/x-www-form-urlencoded']
            },
            handler: function (request, reply) {

                Api.Assets.create(request, function (err, results) {
                    reply(err ? err : results);
                });
            }
        }
    });

    // Handle HTML5-style file uploads as streams (preferred)
    // TODO: Consider explicit allows, or user-configurable allows.
    server.route({
        method: 'POST',
        path: '/api/v1/files',
        config: {
            payload: {
                output: 'stream',
                parse: true
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
        path: '/api/v1/files/{id}',
        config: {
            payload: {
                output: 'stream',
                parse: true
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

                Api.Assets.edit(request, function (err, results) {
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

                Api.Assets.edit(request, function (err, results) {
                    reply(err ? err : results);
                });
            }
        }
    });

    server.route({
        method: 'DELETE',
        path: '/api/v1/assets/{id}',
        handler: function (request, reply) {

            Api.Assets.remove(request, function (err) {
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
        path: '/api/v1/tags.json',
        handler: function (request, reply) {

            Api.Tags.create(request, function (err, results) {
                reply(err ? err : results);
            });
        }
    });

    server.route({
        method: 'PUT',
        path: '/api/v1/tags/{id}.json',
        handler: function (request, reply) {

            Api.Tags.edit(request, function (err, results) {
                reply(err ? err : results);
            });
        }
    });

    server.route({
        method: 'GET',
        path: '/api/v1/tags.json',
        handler: function (request, reply) {

            Api.Tags.list(request, function (err, results) {
                reply(err ? err : results);
            });
        }
    });

    server.route({
        method: 'GET',
        path: '/api/v1/tags/{id}.json',
        handler: function (request, reply) {

            Api.Tags.read(request, function (err, results) {
                reply(err ? err : results);
            });
        }
    });

    server.route({
        method: 'DELETE',
        path: '/api/v1/tags/{id}.json',
        handler: function (request, reply) {

            Api.Tags.remove(request, function (err, results) {
                reply(err ? err : results);
            });
        }
    });

    // ----------------------
    // Users

    server.route({
        method: 'POST',
        path: '/api/v1/users.json',
        config: {
            payload: {
                allow: ['application/json', 'application/x-www-form-urlencoded']
            },
            handler: function (request, reply) {

                Api.Users.create(request, function (err, results) {
                    reply(err ? err : results);
                });
            }
        }
    });

    server.route({
        method: 'PUT',
        path: '/api/v1/users/{id}.json',
        config: {
            payload: {
                allow: ['application/json', 'application/x-www-form-urlencoded']
            },
            handler: function (request, reply) {

                Api.Users.edit(request, function (err, results) {
                    reply(err ? err : results);
                });
            }
        }
    });

    server.route({
        method: 'GET',
        path: '/api/v1/users.json',
        config: {
            handler: function (request, reply) {

                Api.Users.list(request, function (err, results) {
                    reply(err ? err : results);
                });
            }
        }
    });

    server.route({
        method: 'GET',
        path: '/api/v1/users/{id}.json',
        config: {
            handler: function (request, reply) {

                Api.Users.read(request, function (err, results) {
                    reply(err ? err : results);
                });
            }
        }
    });

    server.route({
        method: 'GET',
        path: '/api/v1/users/current.json',
        config: {
            auth: false,
            handler: function (request, reply) {

                Auth.upgradeUser(request, function (err, user) {
                    reply(err ? err : user);
                });
            }
        }
    });

    server.route({
        method: 'DELETE',
        path: '/api/v1/users/{id}.json',
        config: {
            handler: function (request, reply) {

                Api.Users.remove(request, function (err, results) {
                    reply(err ? err : results);
                });
            }
        }
    });

};

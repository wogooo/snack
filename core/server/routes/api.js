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
        path: '/api/v1/posts.json',
        handler: function (request, reply) {

            Api.posts.list(request, function (err, results) {
                reply(err ? err : results);
            });
        }
    });

    server.route({
        method: 'POST',
        path: '/api/v1/posts.multipart',
        config: {
            payload: {
                output: 'file',
                allow: 'multipart/form-data'
            },
            handler: function (request, reply) {

                Api.posts.create(request, function (err, results) {
                    reply(err ? err : results);
                });
            }
        }
    });

    server.route({
        method: 'POST',
        path: '/api/v1/posts.json',
        config: {
            auth: {
                strategies: ['token', 'passport-api']
            },
            payload: {
                output: 'data',
                allow: 'application/json'
            }
        },
        handler: function (request, reply) {

            Api.posts.create(request, function (err, results) {
                reply(err ? err : results);
            });
        }
    });

    server.route({
        method: 'PUT',
        path: '/api/v1/posts/{id}.multipart',
        config: {
            payload: {
                output: 'file',
                allow: 'multipart/form-data'
            },
            handler: function (request, reply) {

                Api.posts.edit(request, function (err, results) {
                    reply(err ? err : results);
                });
            }
        }
    });

    server.route({
        method: 'PUT',
        path: '/api/v1/posts/{id}.json',
        config: {
            auth: {
                strategies: ['token', 'passport-api']
            },
            payload: {
                output: 'data',
                allow: 'application/json'
            }
        },
        handler: function (request, reply) {

            Api.posts.edit(request, function (err, results) {
                reply(err ? err : results);
            });
        }
    });

    server.route({
        method: 'GET',
        path: '/api/v1/posts/{id}.json',
        handler: function (request, reply) {

            Api.posts.read(request, function (err, results) {
                reply(err ? err : results);
            });
        }
    });

    server.route({
        method: 'DELETE',
        path: '/api/v1/posts/{id}.json',
        config: {
            auth: {
                strategies: ['token', 'passport-api']
            }
        },
        handler: function (request, reply) {

            Api.posts.remove(request, function (err, results) {
                reply(err ? err : results);
            });
        }
    });


    // ----------------------
    // Files

    // Handle HTML5-style file uploads as streams (preferred)
    server.route({
        method: 'POST',
        path: '/api/v1/files.file',
        config: {
            payload: {
                output: 'stream'
            },
            handler: function (request, reply) {

                Api.assets.storeFile(request, function (err, results) {
                    reply(err ? err : results);
                });
            }
        }
    });

    server.route({
        method: 'PUT',
        path: '/api/v1/files/{id}.file',
        config: {
            payload: {
                output: 'stream'
            },
            handler: function (request, reply) {

                Api.assets.storeFile(request, function (err, results) {
                    reply(err ? err : results);
                });
            }
        }
    });

    // ----------------------
    // Assets

    // Handle multipart uploads
    server.route({
        method: 'POST',
        path: '/api/v1/assets.multipart',
        config: {
            payload: {
                output: 'file',
                allow: 'multipart/form-data'
            },
            handler: function (request, reply) {

                Api.assets.create(request, function (err, results) {
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
                allow: ['application/json']
            },
            handler: function (request, reply) {

                Api.assets.create(request, function (err, results) {
                    reply(err ? err : results);
                });
            }
        }
    });

    server.route({
        method: 'PUT',
        path: '/api/v1/assets/{id}.multipart',
        config: {
            payload: {
                output: 'file',
                allow: 'multipart/form-data'
            },
            handler: function (request, reply) {

                Api.assets.edit(request, function (err, results) {
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
                allow: ['application/json']
            },
            handler: function (request, reply) {

                Api.assets.edit(request, function (err, results) {
                    reply(err ? err : results);
                });
            }
        }
    });

    server.route({
        method: 'DELETE',
        path: '/api/v1/assets/{id}.json',
        handler: function (request, reply) {

            Api.assets.remove(request, function (err) {
                reply(err ? err : results);
            });
        }
    });

    server.route({
        method: 'GET',
        path: '/api/v1/assets/{id}.json',
        handler: function (request, reply) {

            Api.assets.read(request, function (err, results) {
                reply(err ? err : results);
            });
        }
    });

    server.route({
        method: 'GET',
        path: '/api/v1/assets.json',
        handler: function (request, reply) {

            Api.assets.list(request, function (err, results) {
                reply(err ? err : results);
            });
        }
    });

    // ----------------------
    // Tags

    server.route({
        method: 'GET',
        path: '/api/v1/tags.json',
        config: {
            description: 'Returns a tagList, scoped by optional query params.',
            tags: ['api', 'tags', 'list']
        },
        handler: function (request, reply) {

            Api.requestHandler('tags', 'list', request, reply);
        }
    });

    server.route({
        method: 'POST',
        path: '/api/v1/tags.json',
        config: {
            auth: {
                strategies: ['token', 'passport-api'],
            },
            description: 'Creates a new tag, or several tags if `items` array is used.',
            tags: ['api', 'tags', 'create', 'auth']
        },
        handler: function (request, reply) {

            Api.requestHandler('tags', 'create', request, reply);
        }
    });

    server.route({
        method: 'GET',
        path: '/api/v1/tags/{id}.json',
        config: {
            description: 'Get an existing tag by id.',
            tags: ['api', 'tags', 'read']
        },
        handler: function (request, reply) {

            Api.requestHandler('tags', 'read', request, reply);
        }
    });

    server.route({
        method: 'PUT',
        path: '/api/v1/tags/{id}.json',
        config: {
            auth: {
                strategies: ['token', 'passport-api'],
                mode: 'try'
            },
            description: 'Edit an existing tag by id.',
            tags: ['api', 'tags', 'edit', 'auth']
        },
        handler: function (request, reply) {

            Api.requestHandler('tags', 'edit', request, reply);
        }
    });

    server.route({
        method: 'DELETE',
        path: '/api/v1/tags/{id}.json',
        config: {
            auth: {
                strategies: ['token', 'passport-api'],
                mode: 'try'
            },
            description: 'Remove an existing tag by id.',
            tags: ['api', 'tags', 'remove', 'auth']
        },
        handler: function (request, reply) {

            Api.requestHandler('tags', 'remove', request, reply);
        }
    });

    // ----------------------
    // Users

    server.route({
        method: 'POST',
        path: '/api/v1/users.json',
        config: {
            auth: {
                strategies: ['token', 'passport-api']
            },
            payload: {
                allow: ['application/json']
            },
            handler: function (request, reply) {

                Api.users.create(request, function (err, results) {
                    reply(err ? err : results);
                });
            }
        }
    });

    server.route({
        method: 'PUT',
        path: '/api/v1/users/{id}.json',
        config: {
            auth: {
                strategies: ['token', 'passport-api']
            },
            payload: {
                allow: ['application/json']
            },
            handler: function (request, reply) {

                Api.users.edit(request, function (err, results) {
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

                Api.users.list(request, function (err, results) {
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

                Api.users.read(request, function (err, results) {
                    reply(err ? err : results);
                });
            }
        }
    });

    server.route({
        method: 'DELETE',
        path: '/api/v1/users/{id}.json',
        config: {
            handler: function (request, reply) {

                Api.users.remove(request, function (err, results) {
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

    // ----------------------
    // API authentication

    server.route({
        method: 'POST',
        path: '/api/v1/token.json',
        config: {
            auth: {
                strategies: ['basic']
            }
        },
        handler: function (request, reply) {

            var token = Auth.getToken(request.auth.credentials);
            reply(token);
        }
    });

    // ----------------------
    // DB interactions

    server.route({
        method: 'POST',
        path: '/api/v1/db.json',
        config: {
            auth: {
                strategies: ['token']
            }
        },
        handler: function (request, reply) {

            var token = Auth.getToken(request.auth.credentials);
            reply(token);
        }
    });

};

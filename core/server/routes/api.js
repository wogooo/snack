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

    // server.route({
    //     method: 'GET',
    //     path: '/api/v1/posts',
    //     handler: function (request, reply) {

    //         Api.posts.list(request, function (err, results) {
    //             reply(err ? err : results);
    //         });
    //     }
    // });

    server.route({
        method: 'GET',
        path: '/api/v1/posts.json',
        handler: function (request, reply) {

            Api.posts.list(request, function (err, results) {
                reply(err ? err : results);
            });
        }
    });

    // server.route({
    //     method: 'POST',
    //     path: '/api/v1/posts',
    //     config: {
    //         payload: {
    //             output: 'file',
    //             parse: true,
    //             allow: 'multipart/form-data'
    //         },
    //         handler: function (request, reply) {

    //             Api.posts.create(request, function (err, results) {
    //                 reply(err ? err : results);
    //             });
    //         }
    //     }
    // });

    server.route({
        method: 'POST',
        path: '/api/v1/posts.json',
        config: {
            auth: {
                strategies: ['token', 'passport-api']
            },
            payload: {
                output: 'data',
                parse: true,
                allow: ['application/json', 'application/x-www-form-urlencoded']
            }
        },
        handler: function (request, reply) {

            Api.posts.create(request, function (err, results) {
                reply(err ? err : results);
            });
        }
    });

    // server.route({
    //     method: 'PUT',
    //     path: '/api/v1/posts/{id}',
    //     config: {
    //         payload: {
    //             output: 'file',
    //             parse: true,
    //             allow: 'multipart/form-data'
    //         },
    //         handler: function (request, reply) {

    //             Api.posts.edit(request, function (err, results) {
    //                 reply(err ? err : results);
    //             });
    //         }
    //     }
    // });

    server.route({
        method: 'PUT',
        path: '/api/v1/posts/{id}.json',
        config: {
            auth: {
                strategies: ['token', 'passport-api']
            },
            payload: {
                output: 'data',
                parse: true,
                allow: ['application/json', 'application/x-www-form-urlencoded']
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
    // Assets

    // Handle multipart uploads
    server.route({
        method: 'POST',
        path: '/api/v1/assets',
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
                allow: ['application/json', 'application/x-www-form-urlencoded']
            },
            handler: function (request, reply) {

                Api.assets.create(request, function (err, results) {
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
        path: '/api/v1/files/{id}',
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
        path: '/api/v1/assets/{id}',
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
                allow: ['application/json', 'application/x-www-form-urlencoded']
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
        path: '/api/v1/assets/{id}',
        handler: function (request, reply) {

            Api.assets.remove(request, function (err) {
                reply(err ? err : results);
            });
        }
    });

    server.route({
        method: 'GET',
        path: '/api/v1/assets/{id}',
        handler: function (request, reply) {

            Api.assets.read(request, function (err, results) {
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
        path: '/api/v1/assets',
        handler: function (request, reply) {

            Api.assets.list(request, function (err, results) {
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
        method: 'POST',
        path: '/api/v1/tags.json',
        handler: function (request, reply) {

            Api.tags.create(request, function (err, results) {
                reply(err ? err : results);
            });
        }
    });

    server.route({
        method: 'PUT',
        path: '/api/v1/tags/{id}.json',
        handler: function (request, reply) {

            Api.tags.edit(request, function (err, results) {
                reply(err ? err : results);
            });
        }
    });

    server.route({
        method: 'GET',
        path: '/api/v1/tags.json',
        handler: function (request, reply) {

            Api.tags.list(request, function (err, results) {
                reply(err ? err : results);
            });
        }
    });

    server.route({
        method: 'GET',
        path: '/api/v1/tags/{id}.json',
        handler: function (request, reply) {

            Api.tags.read(request, function (err, results) {
                reply(err ? err : results);
            });
        }
    });

    server.route({
        method: 'DELETE',
        path: '/api/v1/tags/{id}.json',
        handler: function (request, reply) {

            Api.tags.remove(request, function (err, results) {
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
            payload: {
                allow: ['application/json', 'application/x-www-form-urlencoded']
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

                Api.users.remove(request, function (err, results) {
                    reply(err ? err : results);
                });
            }
        }
    });

    server.route({
        method: 'POST',
        path: '/api/v1/token',
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

};

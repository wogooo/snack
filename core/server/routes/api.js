var Fs = require('fs'),
    Path = require('path'),
    Hapi = require('hapi');

module.exports = function (route) {

    var server = route.server;
    var Snack = route.snack;
    var Config = route.config;

    var Api = Snack.api;
    var Auth = Snack.extensions.auth;

    // ----------------------
    // Stories

    server.route({
        method: 'GET',
        path: '/api/v1/stories.json',
        config: {
            auth: {
                strategies: ['token', 'passport-api'],
                mode: 'try'
            },
            description: 'Get a list of stories.',
            tags: ['api', 'stories', 'list', 'auth-optional']
        },
        handler: function (request, reply) {

            Api.requestHandler('stories', 'list', request, reply);
        }
    });

    server.route({
        method: 'POST',
        path: '/api/v1/stories.multipart',
        config: {
            auth: {
                strategies: ['token', 'passport-api']
            },
            payload: {
                output: 'file',
                allow: 'multipart/form-data'
            },
            description: 'Create a new story via multipart/form-data.',
            tags: ['api', 'stories', 'create', 'auth']
        },
        handler: function (request, reply) {

            Api.requestHandler('stories', 'create', request, reply);
        }
    });

    server.route({
        method: 'POST',
        path: '/api/v1/stories.json',
        config: {
            auth: {
                strategies: ['token', 'passport-api']
            },
            payload: {
                output: 'data',
                allow: 'application/json'
            },
            description: 'Create a new story via json data.',
            tags: ['api', 'stories', 'create', 'auth']
        },
        handler: function (request, reply) {

            Api.requestHandler('stories', 'create', request, reply);
        }
    });

    server.route({
        method: 'PUT',
        path: '/api/v1/stories/{id}.multipart',
        config: {
            auth: {
                strategies: ['token', 'passport-api']
            },
            payload: {
                output: 'file',
                allow: 'multipart/form-data'
            },
            description: 'Edit a story via multipart/form-data.',
            tags: ['api', 'stories', 'edit', 'auth']
        },
        handler: function (request, reply) {

            Api.requestHandler('stories', 'edit', request, reply);
        }
    });

    server.route({
        method: 'PUT',
        path: '/api/v1/stories/{id}.json',
        config: {
            auth: {
                strategies: ['token', 'passport-api']
            },
            payload: {
                output: 'data',
                allow: 'application/json'
            },
            description: 'Edit a story via json data.',
            tags: ['api', 'stories', 'create', 'auth']
        },
        handler: function (request, reply) {

            Api.requestHandler('stories', 'edit', request, reply);
        }
    });

    server.route({
        method: 'GET',
        path: '/api/v1/stories/{id}.json',
        config: {
            auth: {
                strategies: ['token', 'passport-api'],
                mode: 'try'
            },
            description: 'Read a story.',
            tags: ['api', 'stories', 'read', 'auth-optional']
        },
        handler: function (request, reply) {

            Api.requestHandler('stories', 'read', request, reply);
        }
    });

    server.route({
        method: 'DELETE',
        path: '/api/v1/stories/{id}.json',
        config: {
            auth: {
                strategies: ['token', 'passport-api']
            },
            description: 'Remove a story.',
            tags: ['api', 'stories', 'remove', 'auth']
        },
        handler: function (request, reply) {

            Api.requestHandler('stories', 'remove', request, reply);
        }
    });

    // ----------------------
    // Files

    // Handle HTML5-style file uploads as streams (preferred)
    server.route({
        method: 'POST',
        path: '/api/v1/files.file',
        config: {
            auth: {
                strategies: ['token', 'passport-api']
            },
            payload: {
                output: 'stream'
            },
            description: 'Store a file to the configured filesystem and create a new asset.',
            tags: ['api', 'files', 'store', 'auth']
        },
        handler: function (request, reply) {

            Api.requestHandler('files', 'store', request, reply);
        }
    });

    server.route({
        method: 'PUT',
        path: '/api/v1/files/{id}.file',
        config: {
            auth: {
                strategies: ['token', 'passport-api']
            },
            payload: {
                output: 'stream'
            },
            description: 'Store a file to the configured filesystem and update an existing asset.',
            tags: ['api', 'files', 'store', 'auth']
        },
        handler: function (request, reply) {

            Api.requestHandler('files', 'store', request, reply);
        }
    });

    // ----------------------
    // Assets

    server.route({
        method: 'GET',
        path: '/api/v1/assets.json',
        config: {
            auth: {
                strategies: ['token', 'passport-api'],
                mode: 'try'
            },
            description: 'List all assets.',
            tags: ['api', 'assets', 'list', 'auth-optional']
        },
        handler: function (request, reply) {

            Api.requestHandler('assets', 'list', request, reply);
        }
    });

    server.route({
        method: 'POST',
        path: '/api/v1/assets.multipart',
        config: {
            payload: {
                output: 'file',
                allow: 'multipart/form-data'
            },
            auth: {
                strategies: ['token', 'passport-api'],
            },
            description: 'Create a new asset.',
            tags: ['api', 'assets', 'list', 'auth', 'multipart']
        },
        handler: function (request, reply) {

            Api.requestHandler('assets', 'create', request, reply);
        }
    });

    server.route({
        method: 'POST',
        path: '/api/v1/assets.json',
        config: {
            payload: {
                output: 'data',
                allow: 'application/json'
            },
            auth: {
                strategies: ['token', 'passport-api'],
            },
            description: 'Create a new asset.',
            tags: ['api', 'assets', 'list', 'auth']
        },
        handler: function (request, reply) {

            Api.requestHandler('assets', 'create', request, reply);
        }
    });

    server.route({
        method: 'GET',
        path: '/api/v1/assets/{id}.json',
        config: {
            auth: {
                strategies: ['token', 'passport-api'],
                mode: 'try'
            },
            description: 'Read a single asset by id.',
            tags: ['api', 'assets', 'read', 'auth-optional']
        },
        handler: function (request, reply) {

            Api.requestHandler('assets', 'read', request, reply);
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
            auth: {
                strategies: ['token', 'passport-api']
            },
            description: 'Edit an existing asset.',
            tags: ['api', 'assets', 'edit', 'auth', 'multipart']
        },
        handler: function (request, reply) {

            Api.requestHandler('assets', 'edit', request, reply);
        }
    });

    server.route({
        method: 'PUT',
        path: '/api/v1/assets/{id}.json',
        config: {
            payload: {
                output: 'data',
                allow: 'application/json'
            },
            auth: {
                strategies: ['token', 'passport-api']
            },
            description: 'Edit an existing asset.',
            tags: ['api', 'assets', 'edit', 'auth']
        },
        handler: function (request, reply) {

            Api.requestHandler('assets', 'edit', request, reply);
        }
    });

    server.route({
        method: 'DELETE',
        path: '/api/v1/assets/{id}.json',
        config: {
            auth: {
                strategies: ['token', 'passport-api']
            },
            description: 'Remove an existing asset.',
            tags: ['api', 'assets', 'remove', 'auth']
        },
        handler: function (request, reply) {

            Api.requestHandler('assets', 'remove', request, reply);
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
                strategies: ['token', 'passport-api']
            },
            payload: {
                allow: ['application/json']
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
                strategies: ['token', 'passport-api']
                // mode: 'try'
            },
            payload: {
                allow: ['application/json']
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
                strategies: ['token', 'passport-api']
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
        method: 'GET',
        path: '/api/v1/users.json',
        config: {
            description: 'Get a list of users.',
            tags: ['api', 'users', 'list']
        },
        handler: function (request, reply) {

            Api.requestHandler('users', 'list', request, reply);
        }
    });

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
            description: 'Create a new user.',
            tags: ['api', 'users', 'create', 'auth']
        },
        handler: function (request, reply) {

            Api.requestHandler('users', 'create', request, reply);
        }
    });

    server.route({
        method: 'GET',
        path: '/api/v1/users/{id}.json',
        config: {
            description: 'Get a single user by id.',
            tags: ['api', 'users', 'read']
        },
        handler: function (request, reply) {

            Api.requestHandler('users', 'read', request, reply);
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
            description: 'Edit an existing user.',
            tags: ['api', 'users', 'edit', 'auth']
        },
        handler: function (request, reply) {

            Api.requestHandler('users', 'edit', request, reply);
        }
    });

    server.route({
        method: 'DELETE',
        path: '/api/v1/users/{id}.json',
        config: {
            auth: {
                strategies: ['token', 'passport-api']
            },
            description: 'Remove a single user by id.',
            tags: ['api', 'users', 'remove', 'auth']
        },
        handler: function (request, reply) {

            Api.requestHandler('users', 'remove', request, reply);
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
    // Aliases

    server.route({
        method: 'GET',
        path: '/api/v1/aliases.json',
        config: {
            auth: {
                strategies: ['token', 'passport-api']
            },
            description: 'Get a list of aliases.',
            tags: ['api', 'aliases', 'list']
        },
        handler: function (request, reply) {

            Api.requestHandler('aliases', 'list', request, reply);
        }
    });

    server.route({
        method: 'POST',
        path: '/api/v1/aliases.json',
        config: {
            auth: {
                strategies: ['token', 'passport-api']
            },
            payload: {
                allow: 'application/json'
            },
            description: 'Create a new alias.',
            tags: ['api', 'aliases', 'create', 'auth']
        },
        handler: function (request, reply) {

            Api.requestHandler('aliases', 'create', request, reply);
        }
    });

    server.route({
        method: 'GET',
        path: '/api/v1/aliases/{id}.json',
        config: {
            description: 'Get a single alias by id.',
            tags: ['api', 'aliases', 'read']
        },
        handler: function (request, reply) {

            Api.requestHandler('aliases', 'read', request, reply);
        }
    });

    server.route({
        method: 'PUT',
        path: '/api/v1/aliases/{id}.json',
        config: {
            auth: {
                strategies: ['token', 'passport-api']
            },
            payload: {
                allow: 'application/json'
            },
            description: 'Edit an existing alias.',
            tags: ['api', 'aliases', 'edit', 'auth']
        },
        handler: function (request, reply) {

            Api.requestHandler('aliases', 'edit', request, reply);
        }
    });

    server.route({
        method: 'DELETE',
        path: '/api/v1/aliases/{id}.json',
        config: {
            auth: {
                strategies: ['token', 'passport-api']
            },
            description: 'Remove a single alias by id.',
            tags: ['api', 'aliases', 'remove', 'auth']
        },
        handler: function (request, reply) {

            Api.requestHandler('aliases', 'remove', request, reply);
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

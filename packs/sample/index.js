'use strict';

// Contrib modules
var _ = require('lodash');
// var Schema = require('jugglingdb')
//     .Schema;

// User modules
var lib = require('./lib');
var utils = lib.utils;
var database = lib.database;
var events = lib.events;

// var models = require('./models');

// Declare internals
var internals = {};

// Defaults
internals.defaults = {
    'db': {
        engine: 'rethinkdb',
        host: 'localhost',
        port: 28015,
        database: 'test',
        maxConnections: 10,
        minConnections: 2,
        connectionIdle: 30000
    }
};

// Plugin constructor
internals.Sample = function (plugin, options) {

    var settings = utils.applyToDefaults(internals.defaults, options);

    this.plugin = plugin;
    this.settings = settings;
    this.db = database.init(settings.db);

    // var schema = new Schema('rethink', {
    //     host: 'localhost',
    //     port: 28015,
    //     database: 'test',
    //     poolMin: 1,
    //     poolMax: 10
    // });

    // this.schema = schema;

    // var Post = schema.define('Post', {
    //     title: { type: String, length: 255 },
    //     content: { type: Schema.Text },
    //     date: { type: Date, default: function () { return new Date(); } },
    //     timestamp: { type: Number, default: Date.now },
    //     published: { type: Boolean, default: false, index: true }
    // });

    // Post.all = function (callback) {
    //     Post.super_.prototype.all.apply(this);
    //     // this.emit('someevent', 'foobar');
    // };

    // this.post = models.post;
};

exports.register = function (plugin, options, next) {
    // console.log('sample registered');
    // plugin.emit('foo', 'bar');

    plugin.views({
        engines: {
            html: 'handlebars'
        },
        path: './templates',
        partialsPath: './templates/partials',
        layout: true
    });

    var sample = new internals.Sample(plugin, options);

    var db = sample.db;
    // Add the route
    // var post = sample.post;

    // post.events.on('foo', function (msg) {
    //     console.log('onFoo', msg);
    // });

    // Post.on('someevent', function (a) {
    //     console.log('onSomeevent', a);
    // });

    plugin.route({
        method: 'GET',
        path: '/create',
        handler: function (request, reply) {
            reply.view('form', {
                title: 'SAMPLE FORM',
                isCreate: true,
                message: 'Hello World!\n'
            });
        }
    });

    plugin.route({
        method: 'GET',
        path: '/list',
        handler: function (request, reply) {
            db.list('post', function (err, result) {

                reply.view('page', {
                    title: 'SAMPLE LIST',
                    isList: true,
                    page: {
                        name: 'Results',
                        contents: result
                    }
                });
            });

        }
    });


    plugin.ext('onPreHandler', function (request, next) {
        function deepen(o) {
            var oo = {}, t, parts, part, nextPart;

            var boundaries = /[\.\[]/;
            var closeArr = /\]$/;
            var count = 0;

            for (var k in o) {
                part = void(0);
                nextPart = void(0);

                t = oo;
                parts = k.split(boundaries);
                var key = parts.pop();

                for (var i = 0; i < parts.length; i++) {

                    part = parts[i];
                    nextPart = parts[i + 1];

                    if (!t[part] && closeArr.test(nextPart)) {
                        t = t[part] = [];
                    } else {

                        if (closeArr.test(part)) {
                            part = part.substring(0, part.length - 1);
                        }

                        t = t[part] = t[part] || {};
                    }
                }
                t[key] = o[k];
            }
            return oo;
        }

        if (request.method === 'post') {
            // console.log('before', request.payload);
            request.payload = deepen(request.payload);
            // console.log('after', request.payload);
        }

        next();
    });

    plugin.route({
        method: 'GET',
        path: '/api/v1/posts',
        handler: function (request, reply) {
            db.list('post', function (err, result) {
                reply(result);
            });
            // post.all(function (err, result) {
            //     request.reply(result);
            // });
        }
    });

    plugin.route({
        method: 'GET',
        path: '/api/v1/posts/{id}',
        handler: function (request, reply) {

            var id = request.params.id;

            db.getWithRelations(id, 'post', function (err, result) {
                reply(result);
            });
        }
    });

    plugin.route({
        method: 'POST',
        path: '/api/v1/posts',
        handler: function (request, reply) {

            var fields = request.payload.fields;
            delete request.payload.fields;

            db.create(request.payload, 'post', function (err, result) {

                var postId = result.generated_keys[0];

                reply.view('page', {
                    title: 'SAMPLE RESPONSE',
                    page: {
                        name: 'Results',
                        contents: '<a href="http://localhost:8008/api/v1/posts/' + postId + '">http://localhost:8008/api/v1/posts/' + postId + '</a>'
                    }
                });

                if (fields.asset) {

                    db.create(fields.asset, 'asset', function (err, result) {
                        var assetRelations = [];

                        result.generated_keys.forEach(function (assetId) {
                            assetRelations.push({
                                'postId': postId,
                                'assetId': assetId
                            });
                        });

                        db.create(assetRelations, 'relation');
                    });
                }

                if (fields.author) {
                    var authorIds = [];
                    fields.author.forEach(function (author) {
                        authorIds.push(author.id);
                    });

                    var authorRelations = [];
                    db.getAll(authorIds, null, 'author', function (err, authors) {
                        authors.forEach(function (a) {
                            authorRelations.push({
                                'postId': postId,
                                'authorId': a.id
                            });
                        });

                        db.create(authorRelations, 'relation');
                    });
                }

            });
        }
    });

    plugin.route({
        method: 'DELETE',
        path: '/api/v1/posts/{id}',
        handler: function (request) {
            // db.destroy(request.params.id, 'tv_shows', function (err, result) {
            //     request.reply(result);
            // });
        }
    });

    plugin.route({
        method: 'PUT',
        path: '/api/v1/posts/{id}',
        handler: function (request) {
            // db.update(request.params.id, request.payload, 'tv_shows', function (err, result) {
            //     request.reply(result);
            // });
        }
    });

    plugin.route({
        method: 'GET',
        path: '/api/v1/test',
        handler: function (request, reply) {
                    var authorIds = [
                        '12a5f5e5-ce55-4122-b669-8aa8fd06c582',
                        'c3f972ca-59a4-4479-8308-ce10122cb81c'
                    ];

                    var authorRelations = [];

                    db.getAll(authorIds, 'id', 'author', function (err, authors) {

                        authors.forEach(function (a) {
                            authorRelations.push({
                                'assetId': a.id
                            });
                        });

                        reply(authorRelations);
                    });


        }
    });

    // if (settings.version) {
    //     plugin.route({
    //         method: 'GET',
    //         path: settings.version,
    //         handler: function () {

    //             this.reply(internals.version);
    //         },
    //         config: {
    //             description: "Display the version number of the current root module."
    //         }
    //     });
    // }

    // if (settings.plugins) {
    //     plugin.route({
    //         method: 'GET',
    //         path: settings.plugins,
    //         handler: function () {

    //             this.reply(listPlugins(this.server));
    //         },
    //         config: {
    //             description: "Display a list of the plugins loaded in the server with their versions."
    //         }
    //     });
    // }

    // var listPlugins = function (server) {

    //     var plugins = [];
    //     Object.keys(server.pack.list).forEach(function (name) {

    //         var plug = server.pack.list[name];
    //         plugins.push({
    //             name: plug.name,
    //             version: plug.version
    //         });
    //     });

    //     return plugins;
    // };

    // plugin.expose({
    //     events: {
    //         post: post
    //     }
    // });

    next();
};

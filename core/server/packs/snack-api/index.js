var _ = require('lodash');
var hoek = require('hoek');
var utile = require('utile');

// User modules
var lib = require('./lib');
var events = lib.events;

// Declare internals
var internals = {};

// Defaults
internals.defaults = {};

// Plugin constructor
internals.SnackApi = function (plugin, options) {

    var settings = hoek.applyToDefaults(internals.defaults, options);
    this.plugin = plugin;
    this.settings = settings;
    this.models = lib.models;
};

internals.SnackApi.prototype.create = function (callback) {

    var settings = this.settings;
    var plugin = this.plugin;
    var models = this.models.getModels();

    plugin.views({
        engines: {
            html: 'handlebars'
        },
        path: './templates',
        partialsPath: './templates/partials',
        layout: true
    });

    plugin.route({
        method: 'GET',
        path: '/test/{id}',
        handler: function (request, reply) {
            var params = request.params;

            var task = {
                type: 'image',
                data: {
                    id: params.id,
                    endpoint: {
                        protocol: 'http:',
                        hostname: 'localhost',
                        port: 8008,
                        pathname: '/api/v1/assets/' + params.id
                    }
                }
            };

            plugin.methods.snackQueue('createJob', task, function (err, result) {
                reply(result);
            });
        }
    });

    plugin.route({
        method: 'POST',
        path: '/api/v1/assets/{id}',
        handler: function (request, reply) {

            var params = request.params;
            var payload = request.payload;

            console.log('POSTED-----------');
            console.log(params);
            console.log(payload);

            reply('ok');
        }
    });

    plugin.route({
        method: 'GET',
        path: '/api/v1/assets/{id}',
        handler: function (request, reply) {

            var params = request.params;
            var data = {};
            if (params.id === 'abc123') {
                data.x = 2;
                data.y = 2;
            } else {
                data.x = 4;
                data.y = 4;
            }

            reply(data);
        }
    });

    plugin.route({
        method: 'GET',
        path: '/api/v1/posts',
        handler: function (request, reply) {

            models.Post.getAll(['assets', 'authors'], {
                    toJSON: true
                },
                function (err, results) {
                    reply(results);
                });
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

    this.models.load(settings, function () {
        callback();
    });
};

exports.register = function (plugin, options, next) {

    var snackApi = new internals.SnackApi(plugin, options);
    snackApi.create(next);

    // _.delay(function () {
    // Post.all(function (err, posts) {
    //     console.log(posts);
    // });
    // }, 2000);

    // var bench = new hoek.Bench();

    // Post.find('7c92bf11-1318-4512-b81b-18b24de6be7e', function (err, post) {

    //     Post.include([post], ['assets', 'authors'], function (err, includes) {
    //         console.log('include callback');
    //         console.log(includes);
    //     });

    //     // console.log(post);

    //     // console.log("POST time: " + bench.elapsed());

    //     // async.series([
    //     //         function (callback) {
    //     //             console.log('authors call');
    //     //             post.authors(callback);
    //     //         },
    //     //         function (callback) {
    //     //             console.log('assets call');
    //     //             post.assets(callback);
    //     //         }
    //     //     ],
    //     //     function (err, results) {
    //     //         console.log("Elapsed time from initialization: " + bench.elapsed() + 'milliseconds');
    //     //         console.log('done!');
    //     //         console.log(results);
    //     //     });
    // });

    // var post = new Post({
    //     title: 'Foo',
    //     content: 'Blah blah foo.'
    // });
    // console.log(Post);

    // post.save(function () {

    //     var asset = post.assets.create({
    //         url: 'http://placekitten.com/777/777'
    //     }, function () {
    //         console.log('asset saved');
    //     });

    //     post.authors.create({
    //         display_name: 'Harry Guillermo',
    //         username: 'hguillermo'
    //     }, function () {
    //         console.log('author saved');
    //     });

    //     post.authors.create({
    //         display_name: 'Michael Shick',
    //         username: 'mshick'
    //     }, function () {
    //         console.log('author saved');
    //     });

    // });

    // console.log('here', blah.get('foo'));

    // console.log('klass', post.toJSON());

    // Add the route
    // var post = sample.post;

    // post.events.on('foo', function (msg) {
    //     console.log('onFoo', msg);
    // });

    // Post.on('someevent', function (a) {
    //     console.log('onSomeevent', a);
    // });

    // plugin.route({
    //     method: 'GET',
    //     path: '/create',
    //     handler: function (request, reply) {
    //         reply.view('form', {
    //             title: 'SAMPLE FORM',
    //             isCreate: true,
    //             message: 'Hello World!\n'
    //         });
    //     }
    // });

    // plugin.route({
    //     method: 'GET',
    //     path: '/list',
    //     handler: function (request, reply) {
    //         db.list('post', function (err, result) {

    //             reply.view('page', {
    //                 title: 'SAMPLE LIST',
    //                 isList: true,
    //                 page: {
    //                     name: 'Results',
    //                     contents: result
    //                 }
    //             });
    //         });

    //     }
    // });

    // plugin.ext('onPreHandler', function (request, next) {
    //     function deepen(o) {
    //         var oo = {}, t, parts, part, nextPart;

    //         var boundaries = /[\.\[]/;
    //         var closeArr = /\]$/;
    //         var count = 0;

    //         for (var k in o) {
    //             part = void(0);
    //             nextPart = void(0);

    //             t = oo;
    //             parts = k.split(boundaries);
    //             var key = parts.pop();

    //             for (var i = 0; i < parts.length; i++) {

    //                 part = parts[i];
    //                 nextPart = parts[i + 1];

    //                 if (!t[part] && closeArr.test(nextPart)) {
    //                     t = t[part] = [];
    //                 } else {

    //                     if (closeArr.test(part)) {
    //                         part = part.substring(0, part.length - 1);
    //                     }

    //                     t = t[part] = t[part] || {};
    //                 }
    //             }
    //             t[key] = o[k];
    //         }
    //         return oo;
    //     }

    //     if (request.method === 'post') {
    //         // console.log('before', request.payload);
    //         request.payload = deepen(request.payload);
    //         // console.log('after', request.payload);
    //     }

    //     next();
    // });

    // plugin.route({
    //     method: 'POST',
    //     path: '/api/v1/posts',
    //     handler: function (request, reply) {

    //         var fields = request.payload.fields;
    //         delete request.payload.fields;

    //         db.create(request.payload, 'post', function (err, result) {

    //             var postId = result.generated_keys[0];

    //             reply.view('page', {
    //                 title: 'SAMPLE RESPONSE',
    //                 page: {
    //                     name: 'Results',
    //                     contents: '<a href="http://localhost:8008/api/v1/posts/' + postId + '">http://localhost:8008/api/v1/posts/' + postId + '</a>'
    //                 }
    //             });

    //             if (fields.asset) {

    //                 db.create(fields.asset, 'asset', function (err, result) {
    //                     var assetRelations = [];

    //                     result.generated_keys.forEach(function (assetId) {
    //                         assetRelations.push({
    //                             'postId': postId,
    //                             'assetId': assetId
    //                         });
    //                     });

    //                     db.create(assetRelations, 'relation');
    //                 });
    //             }

    //             if (fields.author) {
    //                 var authorIds = [];
    //                 fields.author.forEach(function (author) {
    //                     authorIds.push(author.id);
    //                 });

    //                 var authorRelations = [];
    //                 db.getAll(authorIds, null, 'author', function (err, authors) {
    //                     authors.forEach(function (a) {
    //                         authorRelations.push({
    //                             'postId': postId,
    //                             'authorId': a.id
    //                         });
    //                     });

    //                     db.create(authorRelations, 'relation');
    //                 });
    //             }

    //         });
    //     }
    // });

    // plugin.route({
    //     method: 'DELETE',
    //     path: '/api/v1/posts/{id}',
    //     handler: function (request) {
    //         // db.destroy(request.params.id, 'tv_shows', function (err, result) {
    //         //     request.reply(result);
    //         // });
    //     }
    // });

    // plugin.route({
    //     method: 'PUT',
    //     path: '/api/v1/posts/{id}',
    //     handler: function (request) {
    //         // db.update(request.params.id, request.payload, 'tv_shows', function (err, result) {
    //         //     request.reply(result);
    //         // });
    //     }
    // });

    // plugin.route({
    //     method: 'GET',
    //     path: '/api/v1/test',
    //     handler: function (request, reply) {
    //         var authorIds = [
    //             '12a5f5e5-ce55-4122-b669-8aa8fd06c582',
    //             'c3f972ca-59a4-4479-8308-ce10122cb81c'
    //         ];

    //         var authorRelations = [];

    //         db.getAll(authorIds, 'id', 'author', function (err, authors) {

    //             authors.forEach(function (a) {
    //                 authorRelations.push({
    //                     'assetId': a.id
    //                 });
    //             });

    //             reply(authorRelations);
    //         });

    //     }
    // });

    // plugin.expose({
    //     events: {
    //         post: post
    //     }
    // });
};

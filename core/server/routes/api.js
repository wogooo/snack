var api = require('../api');

module.exports = function (server) {

    server.route({
        method: 'POST',
        path: '/api/v1/posts',
        handler: function (request, reply) {

            api.Posts.create(request, function (err, results) {
                reply(results);
            });
        }
    });

    server.route({
        method: 'PUT',
        path: '/api/v1/posts/{id}',
        handler: function (request, reply) {

            api.Posts.update(request, function (err, results) {
                reply(results);
            });
        }
    });

    server.route({
        method: 'GET',
        path: '/api/v1/posts/{id}',
        handler: function (request, reply) {

            api.Posts.read(request, function (err, results) {
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

            api.Posts.destroy(request, function (err, results) {
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

    // server.route({
    //     method: 'GET',
    //     path: '/api/v1/posts/{id}',
    //     handler: function (request, reply) {

    //         var id = request.params.id;

    //         db.getWithRelations(id, 'post', function (err, result) {
    //             reply(result);
    //         });
    //     }
    // });
};

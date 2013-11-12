var internals = {};

module.exports = [
    {
        method: 'GET',
        path: '/api/v1/tv-shows',
        config: {
            handler: internals.getShows
        }
    },
    {
        method: 'GET',
        path: '/api/v1/tv-shows/{id}',
        config: {
            handler: getProduct,
            validate: {
                query: {
                    name: Types.String()
                }
            }
        }
    },
    {
        method: 'POST',
        path: '/products',
        config: {
            handler: addProduct,
            payload: 'parse',
            validate: {
                payload: {
                    name: Types.String().required().min(3)
                }
            }
        }
    }
];

server.route({
    method: 'GET',
    path: '/api/v1/tv-shows',
    handler: function (request) {
        db.list('tv_shows', function (err, result) {
            request.reply(result);
        });
    }
});

server.route({
    method: 'GET',
    path: '/api/v1/tv-shows/{id}',
    handler: function (request) {
        var id = request.params.id;
        db.get(id, 'tv_shows', function (err, result) {
            request.reply(result);
        });
    }
});

server.route({
    method: 'POST',
    path: '/api/v1/tv-shows',
    handler: function (request) {
        db.create(request.payload, 'tv_shows', function (err, result) {
            request.reply(result);
        });
    }
});

server.route({
    method: 'DELETE',
    path: '/api/v1/tv-shows/{id}',
    handler: function (request) {
        db.destroy(request.params.id, 'tv_shows', function (err, result) {
            request.reply(result);
        });
    }
});

server.route({
    method: 'PUT',
    path: '/api/v1/tv-shows/{id}',
    handler: function (request) {
        db.update(request.params.id, request.payload, 'tv_shows', function (err, result) {
            request.reply(result);
        });
    }
});

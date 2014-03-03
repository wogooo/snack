module.exports = function (server) {

    server.route({
        method: 'GET',
        path: '/test-queue',
        handler: function (request, reply) {
            reply.view('test-queue', {
                title: 'DEBUG'
            });
        }
    });
};

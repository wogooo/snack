module.exports = function (server) {

    server.route({
        method: 'GET',
        path: '/test-queue',
        handler: function (request, reply) {
            server.methods.snackQueue('getJobRange', null, function (err, jobList) {
                reply.view('test-queue', {
                    title: 'DEBUG',
                    list: jobList
                });
            });
        }
    });

    server.route({
        method: 'POST',
        path: '/test-post',
        handler: function (request, reply) {

            var payload = request.payload;
            console.log(payload.assets);

            reply('ok');
        }
    });
};

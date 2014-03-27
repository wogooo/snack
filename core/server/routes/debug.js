var Path = require('path');
var Hapi = require('hapi');

module.exports = function (route) {

    var server = route.server;

    server.route({
        method: 'GET',
        path: '/test-queue',
        handler: function (request, reply) {
            server.methods.queue('getJobRange', null, function (err, jobList) {
                reply.view('test-queue', {
                    title: 'DEBUG',
                    list: jobList
                });
            });
        }
    });
};

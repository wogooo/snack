var Path = require('path');
var Hapi = require('hapi');

module.exports = function (route) {

    var server = route.server;
    var Snack = server.app;
    var checkPermission = Snack.permissions.check;

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

    server.route({
        method: 'GET',
        path: '/test-permissions',
        handler: function (request, reply) {

            var canUser = checkPermission(request.user);
            canUser.edit.post('fooId', function (err, permitted) {
                reply('ok' + permitted);
            });
        }
    });
};

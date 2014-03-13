var Path = require('path');
var Hapi = require('hapi');

module.exports = function (route) {

    var server = route.server;
    var Snack = route.snack;
    var Config = route.config;

    var packageInfo = Config().packageInfo;
    var corePath = Config().paths.corePath;
    var clientPath = Path.join(corePath, 'client');

    server.route({
        method: 'GET',
        path: '/admin/{path*}',
        handler: function (request, reply) {
            reply.view('index', {
                title: 'Snack',
                packageInfo: packageInfo
            }, {
                path: Path.join(clientPath, 'views'),
                partialsPath: Path.join(clientPath, 'views/partials'),
                layout: false
            });
        }
    });

    server.route({
        method: 'GET',
        path: '/admin/static/{path*}',
        handler: {
            directory: {
                path: Path.join(clientPath, 'static'),
                listing: false
            }
        }
    });

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
        path: '/test',
        handler: function (request, reply) {
            reply.view('form', {
                title: 'DEBUG'
            });
        }
    });

    server.route({
        method: 'GET',
        path: '/throw',
        handler: function (request, reply) {

            reply(Hapi.error.notFound());
            // throw new Error('foo');

            reply.view('test', {
                title: 'DEBUG'
            });
        }
    });
};

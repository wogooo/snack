var Path = require('path');
var Hapi = require('hapi');

module.exports = function (route) {

    var server = route.server;
    var Snack = route.snack;
    var Config = Snack.config;
    var Auth = Snack.extensions.auth;

    var packageInfo = Config().packageInfo;
    var corePath = Config().paths.corePath;
    var clientPath = Path.join(corePath, 'client');

    server.route({
        method: 'GET',
        path: '/logout',
        config: {
            auth: false,
            handler: function (request, reply) {
                reply().redirect('/snack/logout');
            }
        }
    });

    server.route({
        method: 'GET',
        path: '/login',
        config: {
            auth: false,
            handler: function (request, reply) {
                reply().redirect('/snack/login');
            }
        }
    });

    server.route({
        method: 'GET',
        path: '/clear',
        config: {
            auth: false,
            handler: function (request, reply) {

                request.session.reset();
                reply().redirect('/session');
            }
        }
    });

    server.route({
        method: 'GET',
        path: '/session',
        config: {
            auth: false,
            handler: function (request, reply) {

                reply("<pre>" + JSON.stringify(request.session, null, 2) + "</pre><br/><br/><a href='/login'>Login</a>");
            }
        }
    });
};

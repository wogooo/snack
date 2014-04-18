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
        path: '/snack/{path*}',
        config: {
            auth: 'passport'
        },
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
        path: '/snack/login',
        config: {
            auth: false
        },
        handler: function (request, reply) {

            var flash = request.session.flash(),
                flashErr = false,
                flashErrMsg = '';

            if (flash.error && flash.error.length) {
                flashErr = true;
                flashErrMsg = flash.error[0];
            }

            if (request.session._isAuthenticated()) {

                reply().redirect('/snack');

            } else {

                reply.view('login', {
                    title: 'Sign In',
                    packageInfo: packageInfo,
                    error: flashErr,
                    errorMessage: flashErrMsg
                }, {
                    path: Path.join(clientPath, 'views'),
                    partialsPath: Path.join(clientPath, 'views/partials'),
                    layout: false
                });
            }
        }
    });

    server.route({
        method: 'GET',
        path: '/snack/static/{path*}',
        config: {
            auth: false
        },
        handler: {
            directory: {
                path: Path.join(clientPath, 'static'),
                listing: false
            }
        }
    });

    server.route({
        method: 'POST',
        path: '/snack/login',
        config: {
            auth: false
        },
        handler: function (request, reply) {

            Auth.authenticate(request, reply);
        }
    });

    server.route({
        method: ['POST', 'GET'],
        path: '/snack/logout',
        config: {
            auth: false,
            handler: function (request, reply) {
                request.session._logout();
                reply().redirect('/snack/login');
            }
        }
    });

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

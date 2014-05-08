var Path = require('path');
var Hapi = require('hapi');
var Handlebars = require('handlebars');

var internals = {};

internals.register = function (plugin, options, next) {

    var Snack = plugin.app,
        Auth = Snack.extensions.auth;

    plugin.views({
        engines: {
            html: {
                module: Handlebars.create()
            }
        },
        path: Path.join(__dirname, 'views'),
        partialsPath: Path.join(__dirname, 'views/partials'),
        layout: false
    });

    plugin.route({
        method: 'GET',
        path: '/snack/{path*}',
        config: {
            auth: 'passport'
        },
        handler: function (request, reply) {

            reply.view('index', {
                title: 'Snack'
            });
        }
    });

    plugin.route({
        method: 'GET',
        path: '/snack/static/{path*}',
        config: {
            auth: false
        },
        handler: {
            directory: {
                path: Path.join(__dirname, 'static'),
                listing: false
            }
        }
    });

    plugin.route({
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
                    error: flashErr,
                    errorMessage: flashErrMsg
                });
            }
        }
    });

    plugin.route({
        method: 'POST',
        path: '/snack/login',
        config: {
            auth: false
        },
        handler: function (request, reply) {

            var options = {
                failureFlash: true,
                successRedirect: '/snack',
                failureRedirect: '/snack/login'
            };

            Auth.authenticate(request, reply, options);
        }
    });

    plugin.route({
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

    next();
};

exports.register = internals.register;

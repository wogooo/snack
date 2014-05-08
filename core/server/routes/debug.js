var Path = require('path');
var Hapi = require('hapi');

module.exports = function (route) {

    var server = route.server;
    var Snack = server.app;
    var Auth = Snack.extensions.auth;
    var checkPermission = Snack.permissions.check;

    // server.route({
    //     method: 'GET',
    //     path: '/basic-auth',
    //     config: {
    //         auth: {
    //             strategies: ['basic']
    //         }
    //     },
    //     handler: function (request, reply) {
    //         var token = Auth.getToken(request.auth.credentials);

    //         reply(token);
    //     }
    // });

    server.route({
        method: 'GET',
        path: '/server-view',
        config: {
            auth: {
                strategies: ['token']
            }
        },
        handler: function (request, reply) {
            var replyObj = {
                text: 'I am a JSON response, and you needed a token to get me.',
                credentials: request.auth.credentials
            };
            reply.view('index', replyObj);
        }
    });



    server.route({
        method: 'GET',
        path: '/jwt-auth',
        config: {
            auth: {
                strategies: ['token']
            }
        },
        handler: function (request, reply) {
            var replyObj = {
                text: 'I am a JSON response, and you needed a token to get me.',
                credentials: request.auth.credentials
            };
            reply(replyObj);
        }
    });


    server.pack.events.on('sampleEvent', function (data) {
        console.log('on sampleEvent', data);
    });

    server.route({
        method: 'GET',
        path: '/trigger-event',
        handler: function (request, reply) {

            server.methods.broadcast('permissions.refresh', { test: 'result' }, function () {});
            reply('ok');
        }
    });
};

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
        path: '/jwt-auth',
        config: {
            auth: {
                strategies: ['token', 'passport']
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
};

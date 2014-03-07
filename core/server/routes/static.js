var Path = require('path');

module.exports = function (route) {

    var server = route.server;
    var Snack = route.snack;
    var Config = route.config;

    server.route({
        method: 'GET',
        path: Config().paths.assetsRelPath + '/{path*}',
        handler: {
            directory: {
                path: Config().paths.assetsPath,
                listing: true
            }
        }
    });
};

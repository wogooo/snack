var Url = require('url');
var Path = require('path');

module.exports = function (route) {

    var server = route.server;
    var Snack = route.snack;
    var Config = route.config;
    var paths = Config().paths;

    server.route({
        method: 'GET',
        path: Url.resolve(paths.basePath, paths.assetsRelPath) + '/{path*}',
        handler: {
            directory: {
                path: paths.assetsPath,
                listing: false
            }
        }
    });
};

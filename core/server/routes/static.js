module.exports = function (server) {

    var Snack = server.app;
    var Config = Snack.config;

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

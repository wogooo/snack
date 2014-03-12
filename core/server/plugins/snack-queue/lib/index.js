var SnackQueue = require('./snackQueue');

exports.register = function (plugin, options, next) {

    var snackQueue = new SnackQueue(plugin, options);

    snackQueue.start(function (err) {

        if (err) {
            plugin.log(['plugin', 'error'], 'SnackQueue registration error.', err.message);
            return next(err);
        }

        snackQueue.registerMethods();
        snackQueue.registerRoutes();
        snackQueue.registerSocketIO();

        plugin.log(['plugin', 'info'], 'SnackQueue registered.');

        next();
    });
};

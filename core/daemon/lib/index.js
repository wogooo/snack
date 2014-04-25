var Path = require('path');

var SnackMachine = require('snack-machine');

var internals = {};

internals.startMachine = function (bootstrap) {

    var Config = bootstrap.config;

    var config = {
        config: Config,
        requirePath: Path.resolve(__dirname),
        queue: Config().queue,
        hooks: Config().hooks,
        packs: Config().packs.demons,
        appRoot: Config().paths.appRoot,
        packsPath: Config().paths.packsPath,
        contentPath: Config().paths.contentPath,
        apiUser: 'test',
        serverSecret: Config().secret
    };

    var snackMachine = new SnackMachine(config);

    snackMachine.init(function () {

        var registered = snackMachine._registered;

        var enabled = [],
            disabled = [];

        for (var reg in registered) {
            if (registered[reg]) {
                enabled.push(reg);
            } else {
                disabled.push(reg);
            }
        }

        console.log(
            "Snack Machine is running...".green,
            enabled.length ? ("\nEnabled: " + enabled.join(', ')).grey : '',
            disabled.length ? ("\nDisabled: " + disabled.join(', ')).red : ''
        );
    });
};

module.exports = internals.startMachine;

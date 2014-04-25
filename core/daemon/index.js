var Path = require('path'),
    SnackMachine = require('snack-machine');

function startDaemon(bootstrap) {

    var Config = bootstrap.config,
        config = Config();

    var options = {
        config: Config,
        requirePath: Path.resolve(__dirname),
        queue: config.queue,
        packs: config.packs.demons,
        appRoot: config.paths.appRoot,
        packsPath: config.paths.packsPath,
        contentPath: config.paths.contentPath,
        apiUser: config.machine.user,
        serverSecret: config.secret
    };

    var snackMachine = new SnackMachine(options);

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

module.exports = startDaemon;

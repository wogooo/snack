var Path = require('path');

var DemonMaster = require('./demonMaster');

var internals = {};

internals.startDemons = function (bootstrap) {

    var Config = bootstrap.config;

    var config = {
        config: Config,
        requirePath: Path.resolve(__dirname),
        queue: Config().queue,
        hooks: Config().hooks,
        packs: Config().packs.demons,
        appRoot: Config().paths.appRoot,
        packsPath: Config().paths.packsPath,
        contentPath: Config().paths.contentPath
    };

    var demonMaster = new DemonMaster(config);

    demonMaster.init(function () {

        var registered = demonMaster._registered;
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
            "Snack Demon is running...".green,
            enabled.length ? ("\nEnabled: " + enabled.join(', ')).grey : '',
            disabled.length ? ("\nDisabled: " + disabled.join(', ')).red : ''
        );
    });
};

module.exports = internals.startDemons;

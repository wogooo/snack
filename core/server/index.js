var Path = require('path'),
    Cluster = require('cluster'),
    Async = require('async'),
    Hapi = require('hapi'),
    Hoek = require('hoek');

var ErrorHandling = require('./errorHandling');
var Extensions = require('./extensions');
var Storage = require('./storage');
var Services = require('./services');
var Permissions = require('./permissions');
var Data = require('./data');
var Plugins = require('./plugins');
var Packs = require('./packs');
var Routes = require('./routes');
var Api = require('./api');
var Models = require('./models');
var Themes = require('./themes');

var envVal = process.env.NODE_ENV;

function messages(tags, data, server) {

    if (tags.error) {

        if (tags.serverStop) {
            console.warn("#red{Snack server encountered an error and was stopped.}");
            return;
        }

        if (tags.serverRestart) {
            console.warn("#red{Snack server restarted...}");
            return;
        }

        if (data) {
            console.error("#red{%s}", data);
        }

        return;

    }

    if (tags.info && data) {

        var infoMessage;

        if (data instanceof Object) {

            if (data.message) {
                infoMessage = data.message;
            } else {
                infoMessage = JSON.stringify(data);
            }

        } else {

            infoMessage = data;
        }

        console.info("#grey{" + infoMessage + "}");

        return;
    }

    if (tags.start && data) {

        // Startup & Shutdown messages
        if (envVal === 'production') {
            console.info(
                "#green{Snack is running...}\
                \nYour site is now available on %s\
                \n#grey{Ctrl+C to shut down}",
                data.uri
            );

            // ensure that Snack exits correctly on Ctrl+C
            process.on('SIGINT', function () {
                console.warn(
                    "\n#red{Snack has shut down}\
                     \nYour site is now offline"
                );
                process.exit(0);
            });
        } else {
            console.info("#green{Snack is running in %s...}\
                        \n#grey{Listening on} %s:%s\
                        \n#grey{Url configured as} %s\
                        \n#grey{Ctrl+C to shut down}",
                envVal, data.host, data.port, data.uri);

            // ensure that Snack exits correctly on Ctrl+C
            process.on('SIGINT', function () {
                console.warn(
                    "#red{Snack has shutdown}\
                    \nSnack was running for %d seconds",
                    Math.round(process.uptime())
                );
                process.exit(0);
            });
        }

        return;
    }
}

function logging(pack) {

    // Pass good events to the messages function.
    pack.events.on('log', function (event, tags, data) {
        messages(tags, event.data, event.server);
    });
}

function start(pack, serverInfo) {

    // Start the pack!
    pack.start(function () {

        // Log the start.
        pack.log('start', serverInfo);
    });
}

function setup(bootstrap) {

    // Set up the server and init all modules.
    var Config = bootstrap.config;
    var config = Config();

    var options = {};

    options.labels = ['snack-app'];

    options.views = {
        engines: {
            html: 'handlebars'
        },
        path: Path.join(__dirname, '/views'),
        partialsPath: Path.join(__dirname, '/views/partials'),
        layout: true
    };

    var cache = {
        engine: 'catbox-redis',
        name: 'snack-app'
    };

    cache = Hoek.merge(cache, config.redis);

    options = Hoek.applyToDefaults(config.server.options, options);

    var pack = new Hapi.Pack({
        cache: cache
    });
    var server = pack.server(config.server.host, config.server.port, options);

    // Set up the server.log listener.
    logging(pack);

    server.app.config = Config;

    // NOTE: Weird, but necessary to share Snack all around...
    server.pack.app = server.app;

    var initModules = [
        ErrorHandling,
        Storage,
        Services,
        Models,
        Permissions,
        Api,
        Data,
        Plugins,
        Extensions,
        Themes,
        Routes,
        Packs
    ];

    Async.eachSeries(initModules, function (module, next) {

            module.init(server, next);
        },
        function (err) {

            if (err) {
                pack.log(['error', 'registration'], 'One or more core includes didn\'t load.');
            }

            start(pack, server.info);
        });
}

function startErUp(bootstrap) {

    setup(bootstrap);
}

module.exports = startErUp;

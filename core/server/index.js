var Path = require('path');
var Cluster = require('cluster');
var Async = require('async');
var Hapi = require('hapi');
var Utils = require('hoek');

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

var envVal = process.env.NODE_ENV;

function messages(server, tags, log) {

    var serverInfo = server.info;

    if (tags.error) {

        if (tags.serverStop) {
            console.warn("#red{Snack server encountered an error and was stopped.}");
            return;
        }

        if (tags.serverRestart) {
            console.warn("#red{Snack server restarted...}");
            return;
        }

        console.error("#red{%s}", log);
        return;
    }

    // Startup & Shutdown messages
    if (envVal === 'production') {
        console.info(
            "#green{Snack is running...}\
            \nYour site is now available on %s\
            \n#grey{Ctrl+C to shut down}",
            serverInfo.uri
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
                      envVal, serverInfo.host, serverInfo.port, serverInfo.uri);

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
}

function logging(server) {

    // This is weird, but pack events also get server events?
    server.pack.events.on('log', function (event, tags) {

        if (tags.start || tags.error) {
            messages(server, tags, event.data);
        }
    });
}

function start(server) {

    // Start the server!
    server.start(function () {

        // Log the start.
        server.log('start');
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

    options.cache = {
        engine: 'catbox-redis',
        name: 'snack-app'
    };

    options.cache = Utils.merge(options.cache, config.redis);

    options = Utils.applyToDefaults(config.server.options, options);

    var server = Hapi.createServer(config.server.host, config.server.port, options);

    // Set up the server.log listener.
    logging(server);

    server.app.config = Config;

    var init = [{
        name: 'errorHandling',
        module: ErrorHandling
    }, {
        name: 'storage',
        module: Storage
    }, {
        name: 'services',
        module: Services
    }, {
        name: 'models',
        module: Models
    }, {
        name: 'data',
        module: Data
    }, {
        name: 'permissions',
        module: Permissions
    }, {
        name: 'plugins',
        module: Plugins
    }, {
        name: 'api',
        module: Api
    }, {
        name: 'extensions',
        module: Extensions
    }, {
        name: 'routes',
        module: Routes
    }, {
        name: 'packs',
        module: Packs
    }];

    Async.eachSeries(init, function (item, next) {

            item.module.init(server, next);
        },
        function (err) {
            if (err) {
                server.log(['error', 'registration'], 'One or more core includes didn\'t load.');
            }

            start(server);
        });
}

function startServer(bootstrap) {

    setup(bootstrap);
}

module.exports = startServer;

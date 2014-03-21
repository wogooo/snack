var Path = require('path');
var Cluster = require('cluster');
var Async = require('async');
var Hapi = require('hapi');
var Utils = Hapi.utils;

var Config = require('./config');
var ErrorHandling = require('./errorHandling');
var Extensions = require('./extensions');
var Storage = require('./storage');
var Services = require('./services');
var Plugins = require('./plugins');
var Routes = require('./routes');
var Api = require('./api');
var Models = require('./models');

var envVal = process.env.NODE_ENV;

function messages(tags, log) {

    if (tags.error) {

        if (tags.serverStop) {
            console.log('Snack server encountered an error and was stopped.'.red);
            return;
        }

        if (tags.serverRestart) {
            console.log('Snack server restarted...'.red);
            return;
        }

        console.log(('Error: ' + log).red);
        return;
    }

    // Startup & Shutdown messages
    if (envVal === 'production') {
        console.log(
            "Snack is running...".green,
            "\nYour site is now available on",
            Config().url,
            "\nCtrl+C to shut down".grey
        );

        // ensure that Snack exits correctly on Ctrl+C
        process.on('SIGINT', function () {
            console.log(
                "\nSnack has shut down".red,
                "\nYour site is now offline"
            );
            process.exit(0);
        });
    } else {
        console.log(
            ("Snack is running in " + envVal + "...").green,
            "\nListening on",
            Config().server.host + ':' + Config().server.port,
            "\nUrl configured as:",
            Config().url,
            "\nCtrl+C to shut down".grey
        );
        // ensure that Snack exits correctly on Ctrl+C
        process.on('SIGINT', function () {
            console.log(
                "\nSnack has shutdown".red,
                "\nSnack was running for",
                Math.round(process.uptime()),
                "seconds"
            );
            process.exit(0);
        });
    }
}

function logging(server) {

    // This is weird, but pack events also get server events?
    server.pack.events.on('log', function (event, tags) {

        if (tags.start || tags.error) {
            messages(tags, event.data);
        }
    });
};

function start(server) {

    // Start the server!
    server.start(function () {

        // Log the start.
        server.log('start');
    });
}

function setup() {

    // Set up the server and init all modules.

    var config = Config();

    var options = {};

    options.labels = ['snack-app', 'socket.io'];

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
        module: ErrorHandling,
        expose: false
    }, {
        name: 'extensions',
        module: Extensions,
        expose: false
    }, {
        name: 'storage',
        module: Storage,
        expose: true
    }, {
        name: 'services',
        module: Services,
        expose: true
    }, {
        name: 'models',
        module: Models,
        expose: true
    }, {
        name: 'api',
        module: Api,
        expose: true
    }, {
        name: 'routes',
        module: Routes,
        expose: false
    }, {
        name: 'plugins',
        module: Plugins,
        expose: false
    }];

    Async.eachSeries(init, function (item, next) {

            if (item.expose) {
                server.app[item.name] = item.module;
            }

            item.module.init(server, next);
        },
        function (err) {
            if (err) {
                server.log(['error', 'registration'], 'One or more core includes didn\'t load.');
            }

            start(server);
        });
}

function init() {

    setup();
}

module.exports = init;

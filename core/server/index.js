var Cluster = require('cluster');
var Async = require('async');
var Hapi = require('hapi');
var Utils = Hapi.utils;
var Config = require('./config');
var Packs = require('./packs');
var Routes = require('./routes');
var Api = require('./api');
var Models = require('./models');

function messages() {

    var envVal = process.env.NODE_ENV;

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

function start(server, callback) {

    // Start the server!

    if (!callback) {
        callback = messages;
    }

    server.start(callback);
}

function errorHandling(server) {

    // Safely bring down the server and either restart, or
    // trigger a cluster disconnect.

    server.on('internalError', function (request, err) {
        if (err.data.domainThrown) {
            try {

                // make sure we close down within 30 seconds
                var killtimer = setTimeout(function () {
                    process.exit(1);
                }, 30000);

                // But don't keep the process open just for that!
                killtimer.unref();

                // stop taking new requests.
                server.stop(function () {
                    console.error('Snack server stopped... Attempting restart');
                });

                // Let the master know we're dead.  This will trigger a
                // 'disconnect' in the cluster master, and then it will fork
                // a new worker.
                if (Cluster.isWorker) {
                    Cluster.worker.disconnect();
                } else {
                    start(server, function () {
                        console.info('Snack server successfully restarted.');
                    });
                }
            } catch (er2) {
                // oh well, not much we can do at this point.
                console.error('Error sending 500!', er2.stack);
            }
        }
    });
}

function setup() {

    // Set up the server and init all modules.

    var config = Config();

    var options = {
        views: {
            engines: {
                html: 'handlebars'
            },
            path: __dirname + '/templates'
        },
        labels: ['snack-app']
    };

    var server = Hapi.createServer(config.server.host, config.server.port, options);

    errorHandling(server);

    Async.eachSeries([
            Models,
            Api,
            Routes,
            Packs
        ], function (module, next) {

            module.init(server, next);

        },
        function (err) {

            if (err) {
                console.error(new Error('Error loading server...'));
                return;
            }

            start(server);
        });
}

function init() {

    setup();
}

module.exports = init;

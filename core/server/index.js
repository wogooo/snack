var Cluster = require('cluster');
var Async = require('async');
var Hapi = require('hapi');
var Utils = Hapi.utils;
var Config = require('./config')();
var Packs = require('./packs');
var Routes = require('./routes');
var Api = require('./api');
var Models = require('./models');

// Declare internals
var internals = {};

internals.Snack = function () {};

internals.Snack.prototype.start = function () {

    var server = this.server;

    server.start(function () {

        console.info('🍪  Snack App listening! %s:%s', server.info.host, server.info.port);
    });
};

internals.Snack.prototype.init = function () {

    var self = this;

    var options = {
        views: {
            engines: {
                html: 'handlebars'
            },
            path: __dirname + '/templates'
        },
        labels: ['snack-app']
    };

    var server = Hapi.createServer(Config.server.host, Config.server.port, options);

    this.server = server;

    Models.init(self, function () {
        Api.init(self, function () {
            Routes.init(self, function () {
                console.log('all set!');
            });
        });
    });

    this.errorHandling();

    this.loadPacks(function (err) {

        if (err) {
            console.error('Failed loading plugins');
        }

        self.start();
    });
};

// Load packs from /packs dir
internals.Snack.prototype.loadPacks = function (callback) {

    var server = this.server;

    var loadPacks = {};
    var pack, packPath;

    for (var name in Packs) {
        pack = Packs[name];
        packPath = pack.path || name;
        loadPacks[packPath] = pack.options;
    }

    server.pack.require(loadPacks, callback);
};

internals.Snack.prototype.errorHandling = function () {

    var self = this;
    var server = this.server;

    // TODO: Is this compatible with PM2??

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
                server.stop();

                // Let the master know we're dead.  This will trigger a
                // 'disconnect' in the cluster master, and then it will fork
                // a new worker.
                if (Cluster.isWorker) {
                    Cluster.worker.disconnect();
                } else {
                    self.start();
                }
            } catch (er2) {
                // oh well, not much we can do at this point.
                console.error('Error sending 500!', er2.stack);
            }
        }
    });
};

internals.Snack.createServer = function () {

    var snack = new internals.Snack();
    snack.init();

    return snack;
};

module.exports = internals.Snack.createServer;

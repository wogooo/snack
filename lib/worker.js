'use strict';

// Core modules
var cluster = require('cluster');

// Contrib modules
var hapi = require('hapi');
var _ = require('lodash');

// Declare internals
var internals = {};

internals.Worker = function (config) {

    this.config = config;
};

internals.Worker.prototype.start = function () {

    var server = this.server;

    server.start(function () {
        var workerId = 0;

        if (cluster.isWorker) {
            workerId = cluster.worker.id;
        }

        console.info('Worker %s: Started on port %s', workerId, server.info.port);
    });
};

internals.Worker.prototype.init = function () {

    var self = this;
    var config = this.config;

    var options = {
        views: {
            engines: { html: 'handlebars' },
            path: __dirname + '/templates'
        }
    };

    var server = hapi.createServer(config.server.host, config.server.port, options);

    this.server = server;

    this.errorHandling();

    this.loadPacks(function (err) {
        if (err) {
            console.error('Failed loading plugins');
        }
        self.start();
    });
};

// Load packs from /packs dir
internals.Worker.prototype.loadPacks = function (callback) {

    var server = this.server;

    var packsPath = '../packs';
    var packs = require(packsPath);

    var loadPacks = {};
    var packPath;

    _.each(packs, function (packOpts, packName) {

        packPath = packOpts.path || packName;
        loadPacks[packPath] = [ packOpts.permissions, packOpts.options ];
    });


    server.pack.require(loadPacks, callback);
};

internals.Worker.prototype.errorHandling = function () {

    var self = this;
    var server = this.server;

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
                if (cluster.isWorker) {
                    cluster.worker.disconnect();
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

internals.Worker.init = function (config) {

    var worker = new internals.Worker(config);
    worker.init();

    return worker;
};

module.exports = internals.Worker;

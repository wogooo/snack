'use strict';

// Core modules
var cluster = require('cluster');

// Contrib modules
var hapi = require('hapi');

// User modules
var database = require('./database');

// Declare internals
var internals = {};

internals.Worker = function (config) {

    this.config = config;
    this.db = database.init(config.db);
};

internals.Worker.prototype.start = function () {

    var config = this.config;

    var server = hapi.createServer(config.server.host, config.server.port);

    // Add the route
    var db = this.db;

    server.route({
        method: 'GET',
        path: '/api/v1/tv-shows',
        handler: function (request) {
            db.list(function (err, result) {
                request.reply(result);
            });
        }
    });

    server.route({
        method: 'GET',
        path: '/api/v1/tv-shows/{id}',
        handler: function (request) {
            var id = request.params.id;
            db.get(id, function (err, result) {
                request.reply(result);
            });
        }
    });

    this.server = server;

    this.errorHandling();

    server.start(function () {
        var workerId = 0;

        if (cluster.isWorker) {
            workerId = cluster.worker.id;
        }

        console.info('Worker %s: Started on port %s', workerId, server.info.port);
    });
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
    worker.start();

    return worker;
};

module.exports = internals.Worker;

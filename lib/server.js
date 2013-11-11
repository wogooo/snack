'use strict';

// Load contrib modules
var _ = require('lodash');

// Load user modules
var worker = require('./worker');

// Declare internals
var internals = {};

// Server constructor
internals.Server = function (config) {

    var defaults = {
        server: {
            host: 'localhost',
            port: 28015
        }
    };

    this.config = _.defaults(config || {}, defaults);
};

internals.Server.prototype.launch = function (cluster) {

    var config = this.config;

    // Code to run if we're in the master process
    if (config.server.cluster && cluster.isMaster) {

        var workerCount = 1;

        if (config.server.workerCount) {

            // Use the config val
            workerCount = config.server.workerCount;
        } else {

            // Count the machine's CPUs
            workerCount = require('os').cpus().length;
        }

        // Create worker forks
        for (var i = 0; i < workerCount; i++) {
            cluster.fork();
        }

        // On disconnect notice, restart worker
        cluster.on('disconnect', function (instance) {
            console.error('Worker ' + instance.id + ' died. Restarting.');
            cluster.fork();
        });

    } else {

        worker.init(config);
    }
};

internals.Server.init = function (cluster, config) {

    // Create a new server instance
    var server = new internals.Server(config);
    server.launch(cluster);

    return server;
};

module.exports = internals.Server;

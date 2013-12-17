'use strict';

// var axon = require('axon');
var cluster = require('cluster');

var connection = require('strong-mq')
    .create()
    .open();

var internals = {};

internals.registerPush = function () {
    console.log('pub server started');

    var q = connection.createPubQueue();

    var workerId = cluster.worker.id;

    setInterval(function () {
        console.log('Worker ' + workerId + ' is sending');

        q.publish({
            job: 'clean pool',
            worker: workerId
        }, 'foo');

    }, 1000);
};

internals.registerPull = function () {
    console.log('sub client started');

    var q = connection.createSubQueue();

    var workerId = cluster.worker.id;

    q.subscribe('foo', function (msg) {
        console.log('yes');
        // console.log('Received by ' + workerId + ':', msg.toString());
    });
};

exports.register = function (plugin, options, next) {

    console.log('messageQueue registered');

    // internals.registerPush();
    // internals.registerPull();

    next();
};

var Hapi = require('hapi');
var Utils = Hapi.utils;
var Bootstrap = require('./bootstrap');

process.env.NODE_ENV = process.env.NODE_ENV || 'development';

function startServer(bootstrap) {
    var Server = require('./server');
    Server(bootstrap);
}

function startDemon(bootstrap) {
    var Demon = require('./demon');
    Demon(bootstrap);
}

function start(options) {

    options = options || {};

    Bootstrap(options.config, function (err, bootstrap) {

        Utils.assert(!err, 'Cannot start Snack!', err);

        var load = options.load || [];

        if (load.indexOf('demon') > -1 || !load.length) {

            startDemon(bootstrap);
        }

        if (load.indexOf('app') > -1 || !load.length) {

            startServer(bootstrap);
        }
    });
}

module.exports = start;

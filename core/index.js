var Hapi = require('hapi');
var Utils = Hapi.utils;
var Bootstrap = require('./bootstrap');

process.env.NODE_ENV = process.env.NODE_ENV || 'development';

function startServer() {
    var Server = require('./server');
    Server();
}

function startDemon() {
    var Demon = require('./server/demon');
    Demon();
}

function start(options) {

    options = options || {};

    Bootstrap(options.config, function (err) {

        Utils.assert(!err, 'Cannot start Snack!', err);

        var load = options.load || [];

        if (load.indexOf('demon') > -1 || !load.length) {

            startDemon();
        }

        if (load.indexOf('app') > -1 || !load.length) {

            startServer();
        }
    });
}

module.exports = start;

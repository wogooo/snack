var Hapi = require('hapi');
var Utils = require('hoek');

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

        var SNACK_ENV = options.SNACK_ENV || [];

        if (SNACK_ENV.indexOf('demon') > -1 || !SNACK_ENV.length) {

            startDemon(bootstrap);
        }

        if (SNACK_ENV.indexOf('app') > -1 || !SNACK_ENV.length) {

            startServer(bootstrap);
        }
    });
}

module.exports = start;

var Hapi = require('hapi');
var Hoek = require('hoek');

var Bootstrap = require('./bootstrap');

process.env.NODE_ENV = process.env.NODE_ENV || 'development';

function startServer(bootstrap) {
    var Server = require('./server');
    Server(bootstrap);
}

function startDemon(bootstrap) {
    var Daemon = require('./daemon');
    Daemon(bootstrap);
}

function start(options) {

    options = options || {};

    Bootstrap(options.config, function (err, bootstrap) {

        Hoek.assert(!err, 'Cannot start Snack!', err);

        var SNACK_ENV = options.SNACK_ENV || [];

        if (SNACK_ENV.indexOf('daemon') > -1 || !SNACK_ENV.length) {

            startDaemon(bootstrap);
        }

        if (SNACK_ENV.indexOf('app') > -1 || !SNACK_ENV.length) {

            startServer(bootstrap);
        }
    });
}

module.exports = start;

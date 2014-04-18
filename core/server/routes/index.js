/*jshint sub:true*/

var Hapi = require('hapi');

var requires = [
    'admin',
    'api',
    'debug',
    'static'
];

exports.init = function (server, next) {

    var root = {};
    root.server = server;
    root.snack = server.app;
    root.config = server.app.config;

    requires.forEach(function (requireName) {
        require('./' + requireName)(root);
    });

    next();
};

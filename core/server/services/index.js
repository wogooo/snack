/*jshint sub:true*/

var Hapi = require('hapi');
var Utils = Hapi.utils;

var SocketIO = require('socket.io');

exports.init = function (server, next) {

    exports['socket.io'] = SocketIO.listen(server.listener, {
        log: false
    });

    next();
};

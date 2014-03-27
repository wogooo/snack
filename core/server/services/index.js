var Hapi = require('hapi');
var Utils = Hapi.utils;

var SocketIO = require('socket.io');

exports.init = function (server, next) {

    var Snack = server.app;

    Snack.services = {};

    Snack.services['socket.io'] = SocketIO.listen(server.listener, {
        log: false
    });

    next();
};

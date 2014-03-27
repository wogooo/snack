var Hapi = require('hapi');
var Utils = Hapi.utils;

var Schema = require('jugglingdb').Schema;
var SocketIO = require('socket.io');

var Config = require('../config');

exports.init = function (server, next) {

    var Snack = server.app,
        services = {},
        dbConfig = Config().db;

    // Provide Socket.io
    services['socket.io'] = SocketIO.listen(server.listener, { log: false });

    // Provide a schema instance
    services.schema = new Schema(dbConfig.engine, dbConfig);

    // Expose on the app
    Snack.services = services;

    next();
};

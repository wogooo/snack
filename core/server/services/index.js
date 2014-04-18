var Hapi = require('hapi');
var Utils = require('hoek');

var Schema = require('jugglingdb').Schema;
var EngineIO = require('engine.io');

var Config = require('../config');

exports.init = function (server, next) {

    var Snack = server.app,
        services = {},
        dbConfig = Config().db;

    // Provide a schema instance
    services.schema = new Schema(dbConfig.engine, dbConfig);

    // Expose on the app
    Snack.services = services;

    next();
};

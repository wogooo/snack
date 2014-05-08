var Hapi = require('hapi');
var Utils = require('hoek');

var Schema = require('jugglingdb').Schema;
var Thinky = require('thinky');
var EngineIO = require('engine.io');

var Config = require('../config');

exports.init = function (server, next) {

    var Snack = server.app,
        services = {},
        dbConfig = Config().db;

    // Provide a schema instance
    services.schema = new Schema(dbConfig.engine, dbConfig);

    // Provide a thinky instance
    var thinkyOptions = {
        host: dbConfig.host,
        post: dbConfig.port,
        db: dbConfig.database,
        min: dbConfig.minConnections,
        max: dbConfig.maxConnections
    }
    services.thinky = new Thinky(thinkyOptions);

    // Expose on the app
    Snack.services = services;

    next();
};

'use strict';

// Contrib modules
var _ = require('lodash');

// User modules
var utils = require('./utils');
var database = require('./database');

// Declare internals
var internals = {};

// Defaults
internals.defaults = {
    'db': {
        engine: 'rethinkdb',
        host: 'localhost',
        port: 28015,
        database: 'test',
        maxConnections: 10,
        minConnections: 2,
        connectionIdle: 30000
    }
};

// Plugin constructor
internals.Sample = function (plugin, options) {

    var settings = utils.applyToDefaults(internals.defaults, options);

    this.plugin = plugin;
    this.settings = settings;
    this.db = database.init(settings.db);
};

exports.register = function (plugin, options, next) {

    var sample = new internals.Sample(plugin, options);

    // Add the route
    var db = sample.db;

    plugin.route({
        method: 'GET',
        path: '/api/v1/tv-shows',
        handler: function (request) {
            db.list('tv_shows', function (err, result) {
                request.reply(result);
            });
        }
    });

    plugin.route({
        method: 'GET',
        path: '/api/v1/tv-shows/{id}',
        handler: function (request) {
            var id = request.params.id;
            db.get(id, 'tv_shows', function (err, result) {
                request.reply(result);
            });
        }
    });

    plugin.route({
        method: 'POST',
        path: '/api/v1/tv-shows',
        handler: function (request) {
            db.create(request.payload, 'tv_shows', function (err, result) {
                request.reply(result);
            });
        }
    });

    plugin.route({
        method: 'DELETE',
        path: '/api/v1/tv-shows/{id}',
        handler: function (request) {
            db.destroy(request.params.id, 'tv_shows', function (err, result) {
                request.reply(result);
            });
        }
    });

    plugin.route({
        method: 'PUT',
        path: '/api/v1/tv-shows/{id}',
        handler: function (request) {
            db.update(request.params.id, request.payload, 'tv_shows', function (err, result) {
                request.reply(result);
            });
        }
    });

    // if (settings.version) {
    //     plugin.route({
    //         method: 'GET',
    //         path: settings.version,
    //         handler: function () {

    //             this.reply(internals.version);
    //         },
    //         config: {
    //             description: "Display the version number of the current root module."
    //         }
    //     });
    // }

    // if (settings.plugins) {
    //     plugin.route({
    //         method: 'GET',
    //         path: settings.plugins,
    //         handler: function () {

    //             this.reply(listPlugins(this.server));
    //         },
    //         config: {
    //             description: "Display a list of the plugins loaded in the server with their versions."
    //         }
    //     });
    // }

    // var listPlugins = function (server) {

    //     var plugins = [];
    //     Object.keys(server.pack.list).forEach(function (name) {

    //         var plug = server.pack.list[name];
    //         plugins.push({
    //             name: plug.name,
    //             version: plug.version
    //         });
    //     });

    //     return plugins;
    // };

    // plugin.api({ plugins: listPlugins });

    next();
};

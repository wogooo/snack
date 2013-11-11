// Load modules

var Hoek = require('hoek');
var Path = require('path');


// Declare internals

var internals = {};


// Defaults

internals.defaults = {
    version: '/version',
    plugins: '/plugins'
};


// Version

internals.version = Hoek.loadPackage(Path.join(__dirname, '..')).version;


exports.register = function (plugin, options, next) {

    var settings = Hoek.applyToDefaults(internals.defaults, options);

    if (settings.version) {
        plugin.route({
            method: 'GET',
            path: settings.version,
            handler: function () {

                this.reply(internals.version);
            },
            config: {
                description: "Display the version number of the current root module."
            }
        });
    }

    if (settings.plugins) {
        plugin.route({
            method: 'GET',
            path: settings.plugins,
            handler: function () {

                this.reply(listPlugins(this.server));
            },
            config: {
                description: "Display a list of the plugins loaded in the server with their versions."
            }
        });
    }

    var listPlugins = function (server) {

        var plugins = [];
        Object.keys(server.pack.list).forEach(function (name) {

            var plug = server.pack.list[name];
            plugins.push({
                name: plug.name,
                version: plug.version
            });
        });

        return plugins;
    };

    plugin.api({ plugins: listPlugins });

    next();
};

// This will probably go away... Not sure how where to store pack config yet,
// but they can be installed as node modules.
var Fs = require('fs');
var Path = require('path');
var Async = require('async');
var Hapi = require('hapi');
var Utils = require('hoek');

var Config = require('../config');

var internals = {};

internals.findPacks = function (name, done) {

    var config = Config();
    var SharedLib = require(config.paths.sharedLib);
    var appRoot = config.paths.appRoot;
    var packPath = config.paths.packPath;

    var testPaths = [];

    testPaths.push(Path.join(appRoot, 'node_modules', name));
    testPaths.push(Path.join(packPath, name));
    testPaths.push(Path.join(__dirname, name));

    SharedLib.testPaths(testPaths, done);
};

internals.findContentPath = function (pack, done) {

    var config = Config(),
        contentPath = config.paths.contentPath,
        SharedLib = require(config.paths.sharedLib),
        pluginContentPath;;

    // Check for userspace
    if (pack.options.contentPath) {
        pluginContentPath = pack.options.contentPath;
    } else {
        pluginContentPath = Path.join(contentPath, 'packs', pack.name);
    }

    SharedLib.testPaths(pluginContentPath, done);
};

internals.init = function (server, next) {

    var config = Config(),
        plugins = config.packs.plugins,
        pack,
        packOptions,
        loadPacks = [],
        requirePacks = {};

    for (var name in plugins) {

        if (plugins[name]) {

            packOptions = (plugins[name] instanceof Object) ? plugins[name] : {};

            pack = {
                name: name,
                options: packOptions
            };

            loadPacks.push(pack);
        }
    }

    Async.eachSeries(loadPacks, function (pack, done) {

            // Test each pack for existence
            internals.findPacks(pack.name, function (err, path) {

                if (err) return done(err);

                if (path) {

                    internals.findContentPath(pack, function (err, contentPath) {

                        if (contentPath) {
                            pack.options.contentPath = contentPath;
                        }

                        requirePacks[path] = pack.options;
                        done();
                    });

                    return;
                }

                done();
            });
        },
        function (err) {

            // Finally, pass the needed packs to require.
            server.pack.require(requirePacks, next);
        });
};

exports.init = internals.init;

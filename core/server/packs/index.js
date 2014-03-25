// This will probably go away... Not sure how where to store pack config yet,
// but they can be installed as node modules.
var Fs = require('fs');
var Path = require('path');
var Async = require('async');
var Hapi = require('hapi');
var Utils = Hapi.utils;

var Config = require('../config');

var internals = {};

internals.testPaths = function (paths, done) {

    var testPath,
        manyPaths;

    if (paths instanceof Array && paths.length) {

        manyPaths = true;
        testPath = paths.shift();

    } else {

        testPath = paths;
    }

    Fs.stat(testPath, function (err, stats) {

        if (stats && stats.isDirectory()) {

            return done(null, testPath);

        } else if (manyPaths && paths.length) {

            internals.testPaths(paths, done);

        } else {

            done(err);
        }
    });
};

internals.findPacks = function (name, done) {

    var config = Config();
    var appRoot = config.paths.appRoot;
    var packsPath = config.paths.packsPath;

    var testPaths = [];

    testPaths.push(Path.join(appRoot, 'node_modules', name));
    testPaths.push(Path.join(packsPath, name));
    testPaths.push(Path.join(__dirname, name));

    internals.testPaths(testPaths, done);
};

internals.init = function (server, next) {

    var config = Config(),
        plugins = config.packs.plugins,
        contentPath = config.paths.contentPath,
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

                    // Check for userspace
                    var pluginContentPath;
                    if (pack.options.contentPath) {
                        pluginContentPath = pack.options.contentPath;
                    } else {
                        pluginContentPath = Path.join(contentPath, 'packs', pack.name);
                    }

                    internals.testPaths(pluginContentPath, function (err, pathExists) {

                        if (pathExists) {
                            pack.options.contentPath = pluginContentPath
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

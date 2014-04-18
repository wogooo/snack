var Path = require('path');
var Async = require('async');
var Hapi = require('hapi');
var Utils = require('hoek');
var Config = require('../config');

var PROVIDER = Config().storage;

var internals = {};

internals._findStorage = function (name, done) {

    var config = Config();
    var SharedLib = require(config.paths.sharedLib);
    var appRoot = config.paths.appRoot;
    var packsPath = config.paths.packsPath;

    var testPaths = [];

    testPaths.push(Path.join(appRoot, 'node_modules', name));
    testPaths.push(Path.join(packsPath, name));
    testPaths.push(Path.join(__dirname, name));

    SharedLib.testPaths(testPaths, done);
};

exports.init = function (server, done) {

    var Snack = server.app,
        config = Config(),
        plugins = config.packs.storage,
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

    loadPacks.push({
        name: 'local',
        options: {}
    });

    var _env = {};
    var _providers = {};

    var root = {};
    root.server = server;
    root.snack = Snack;
    root.hapi = Hapi;

    Async.eachSeries(loadPacks, function (pack, next) {

            // Test each pack for existence
            internals._findStorage(pack.name, function (err, path) {

                if (err) return next(err);

                var packageFile = Path.join(path, 'package.json');

                var mod = require(path);
                var storage = mod.storage || mod;
                var pkg = require(packageFile);

                var processor = {
                    name: pkg.name,
                    version: pkg.version,
                    register: storage.register
                };

                var env = {
                    name: processor.name
                };

                _env[env.name] = env;

                root._provider = function _provider() {
                    return function (iface) {
                        _providers[env.name] = iface;
                    };
                };

                root.provider = root._provider();

                processor.register.call(null, root, pack.options || {}, function (err) {
                    next();
                });
            });
        },
        function (err) {

            Snack.storage = _providers[PROVIDER];

            done(err);
        });
};

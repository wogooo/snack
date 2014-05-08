var Path = require('path');
var Async = require('async');
var Hapi = require('hapi');
var Config = require('../config');

var internals = {};

internals._findTheme = function (name, done) {

    var config = Config();
    var SharedLib = require(config.paths.sharedLib);
    var appRoot = config.paths.appRoot;
    var themePath = config.paths.themePath;

    var testPaths = [];

    testPaths.push(Path.join('node_modules', name));
    testPaths.push(Path.join(themePath, name));

    SharedLib.testPaths(testPaths, done);
};

exports.init = function (server, done) {

    var Snack = server.app,
        config = Config(),
        theme = config.theme,
        themeName,
        themeOptions = {};

    if (theme instanceof Object) {
        themeName = theme.name;
        themeOptions = theme;
    }


    var adminPath = Path.join(config.paths.corePath, 'client');
    var themes = {};
    themes[adminPath] = {};

    // Test each pack for existence
    internals._findTheme(themeName, function (err, themePath) {

        if (err) return done(err);

        if (themePath) {

            themes[themePath] = themeOptions;

            server.pack.require(themes, done);

        } else {

            done();
        }
    });
};

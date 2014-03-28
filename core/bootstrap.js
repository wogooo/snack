// This file manages the root level config.js.
require('colors');

var Fs = require('fs'),
    Config = require('./server/config');

function setLogLevel() {

    // Set log level
    var logLevel = Config().logging.level;
    // console.setLevel(console.LEVELS[logLevel]);
}

function readConfigFile(envVal) {

    return require(configFile)[envVal];
}

function validateConfigEnvironment(done) {

    var envVal = process.env.NODE_ENV || undefined;

    try {
        config = readConfigFile(envVal);
    } catch (err) {
        return done(err);
    }

    done(null, config);
}

function loadConfig(configFilePath, done) {

    // Allow config file path to be taken from, in order of importance:
    // environment process, passed in value, default location
    configFile = process.env.SNACK_CONFIG || configFilePath || Config().paths.config;

    Fs.exists(configFile, function checkConfig(configExists) {

        if (!configExists) {
            return done(new Error('No config set!'));
        }

        validateConfigEnvironment(function (err, rawConfig) {
            if (err) {
                return done(err);
            }

            Config.init(rawConfig);
            setLogLevel();

            var bootstrap = {
                config: Config
            };

            done(null, bootstrap);
        });
    });
}

module.exports = loadConfig;

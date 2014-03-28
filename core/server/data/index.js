var Hapi = require('hapi');
var Async = require('async');
var Prompt = require('prompt');

var Seed = require('./seed');
var defaultSettings = require('./defaultSettings.json');

var internals = {};

internals.settings = function (groupName) {

    var settings = [],
        setting;

    for (var group in defaultSettings) {

        if (!groupName || groupName === group) {
            for (var key in defaultSettings[group]) {

                setting = {
                    key: key,
                    value: defaultSettings[group][key].value,
                    group: group
                };

                settings.push(setting);
            }
        }
    }

    return settings;
};

internals.freshDb = function (snack, done) {

    var Snack = snack,
        Models = Snack.models,
        schema = Snack.services.schema,
        settings = internals.settings(),
        setting,
        tasks = [];

    tasks.push(function createTables(next) {

        console.log("Creating tables...".blue);

        schema.autoupdate(function (err) {
            console.log("\u2713 Tables created".green);
            next(err);
        });
    });

    var addSetting = function (sett) {

        return function addSetting(next) {
            Models.Setting.create(sett, next);
        };
    };

    for (var i in settings) {
        tasks.push(addSetting(settings[i]));
    }

    // Bring in the seed tasks
    seedTasks = Seed.getTasks(Snack);

    tasks = tasks.concat(seedTasks);

    Async.series(tasks, function (err) {

        if (err) {

            console.log("Something went wrong initializing the database!".red);

            Models.Setting.findBy('key', 'databaseVersion', function (err, setting) {
                setting.value = 'error';
                setting.save();
                done(err);
            });
        } else {

            done();
        }
    });
};

internals.updateDb = function (snack, done) {

    var Snack = snack,
        Models = Snack.models,
        schema = Snack.services.schema,
        settings = internals.settings('core'),
        tasks = [];

    tasks.push(function updateTables(next) {
        schema.autoupdate(next);
    });

    var updateSetting = function (sett) {

        return function updateSetting(next) {
            Models.Setting.findOne({
                where: {
                    key: sett.key
                }
            }, function (err, setting) {
                setting.updateAttributes(sett, next);
            });
        };
    }

    for (var i in settings) {
        tasks.push(updateSetting(settings[i]));
    }

    Async.series(tasks, done);
};

exports.init = function (server, next) {

    var Snack = server.app,
        Models = Snack.models,
        schema = Snack.services.schema,
        freshDb = internals.freshDb,
        updateDb = internals.updateDb,
        inputFor = false;

    var root = {};
    root.server = server;
    root.snack = Snack;

    // Really awful test for uninitted db...
    Models.Setting.findBy('key', 'databaseVersion', function (err, setting) {

        // If there's an error, or no setting, the assumption is
        // this hasn't been initted...
        if (err || !setting || setting.value === 'error') {

            console.log("---".grey,
                        "\nUninitialized database detected!".red,
                        "\nShould I create a new one?\n");

            inputFor = 'fresh';
        }

        if (setting && setting.value === 'error') {

            console.log("---".grey,
                        "\nThe database appears to have failed to initialize!".red,
                        "\nShould I create a new one?\n");

            inputFor = 'fresh';
        }

        if (!inputFor && setting && setting.value !== defaultSettings.core.databaseVersion.value) {

            console.log("---".grey,
                        "\nDatabase upgrade needed.".blue,
                        "\nShould I proceed?\n");

            inputFor = 'update';
        }

        if (inputFor) {

            Prompt.message = '';
            Prompt.delimiter = '';
            Prompt.start();

            Prompt.get([{
                name: 'yesno',
                description: 'Yes or No:',
                'default': 'No'
            }], function (err, decide) {

                if (err) return next();

                if (decide && decide.yesno.search(/yes/i) > -1) {
                    console.log("Great! Just a minute.".grey, "\n");

                    if (inputFor === 'fresh') {
                        return freshDb(Snack, next);
                    } else {
                        return updateDb(Snack, next);
                    }
                }

                next();
            });


        } else {

            next();
        }
    });
};

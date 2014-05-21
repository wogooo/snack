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

internals.freshDb = function (options, done) {

    var dbVersion = options.dbVersion,
        pack = options.pack,
        Snack = pack.app,
        Models = Snack.models,
        Setting = Models.Setting,
        schema = Snack.services.schema,
        settings = internals.settings(),
        setting,
        tasks = [];

    tasks.push(function createTables(next) {

        console.info("#blue{Creating tables...}");

        schema.autoupdate(function (err) {
            console.info("#green{\u2713 Tables created}");
            next(err);
        });
    });

    var addSetting = function (sett) {

        if (dbVersion && sett.key === 'databaseVersion') {

            return function updateSetting(next) {
                Setting
                    .update(sett, { where: { key: sett.key } })
                    .then(function (setting) {
                        next();
                    })
                    .caught(function (err) {
                        next(err);
                    });
            };

        } else {

            return function addSetting(next) {
                Setting
                    .create(sett)
                    .then(function (setting) {
                        next();
                    })
                    .caught(function (err) {
                        next(err);
                    });
            };
        }
    };

    for (var i in settings) {
        tasks.push(addSetting(settings[i]));
    }

    // Bring in the seed tasks
    seedTasks = Seed.getTasks(Snack);

    tasks = tasks.concat(seedTasks);

    Async.series(tasks, function (err) {

            if (err) {

                console.error("#red{Something went wrong initializing the database!}");
                console.error(err);

                Setting
                    .update({ value: 'error' }, { where: { key: 'databaseVersion' } })
                    .then(function () {
                        done(err);
                    });
        } else {

            pack.events.emit('permissions.refresh');
            done();
        }
    });
};

internals.updateDb = function (options, done) {

    var pack = options.pack,
        Snack = pack.app,
        Models = Snack.models,
        schema = Snack.services.schema,
        settings = internals.settings('core'),
        tasks = [];

    tasks.push(function updateTables(next) {
        schema.autoupdate(next);
    });

    var updateSetting = function (sett) {

        return function updateSetting(next) {
            Models.Setting
                .update(sett, { key: sett.key })
                .then(function (setting) {
                    next();
                })
                .caught(function (err) {
                    next(err);
                });
        };
    };

    for (var i in settings) {
        tasks.push(updateSetting(settings[i]));
    }

    Async.series(tasks, done);
};

internals.interactiveInit = function (pack, dbVersion, next) {

    var freshDb = internals.freshDb,
        updateDb = internals.updateDb,
        inputFor = false;

    // Switch behavior based on assumption about setting return value.

    if (!dbVersion) {

        console.info("#grey{---}\
                    \n#red{Uninitialized database detected!}\
                    \nShould I create a new one?\
                    \n");

        inputFor = 'fresh';
    }

    if (dbVersion && dbVersion.value === 'error') {

        console.info("#grey{---}\
                    \n#red{The database appears to have failed to initialize!}\
                    \nShould I create a new one?\
                    \n");

        inputFor = 'fresh';
    }

    if (!inputFor && dbVersion && dbVersion.value !== defaultSettings.core.databaseVersion.value) {

        console.info("#grey{---}\
                    \n#blue{Database upgrade needed}\
                    \nShould I proceed?\
                    \n");

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

                console.info("#grey{Great! Just a minute.}\n");

                if (inputFor === 'fresh') {
                    return freshDb({
                        pack: pack,
                        dbVersion: dbVersion
                    }, next);
                } else {
                    return updateDb({
                        pack: pack,
                        dbVersion: dbVersion
                    }, next);
                }
            }

            next();
        });

    } else {

        next();
    }
};

exports.init = function (server, next) {

    var pack = server.pack,
        Snack = pack.app,
        Models = Snack.models;

    var Setting = Models.Setting;

    Setting
        .findOne({
            key: 'databaseVersion'
        })
        .then(function (databaseVersion) {

            internals.interactiveInit(pack, databaseVersion, next);
        })
        .catch (function (err) {

            console.error("#red{Something went wrong and the database cannot be initialized!}");
            next(err);
        });
};

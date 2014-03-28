var Hapi = require('hapi');
var Async = require('async');

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

internals.freshDb = function (root, done) {

    var Snack = root.snack,
        Models = Snack.models,
        schema = Snack.services.schema,
        settings = internals.settings(),
        setting,
        tasks = [];

    tasks.push(function createTables(next) {
        schema.autoupdate(next);
    });

    function addSetting(sett) {
        return function (next) {
            setting = new Models.Setting(sett);
            setting.save(next);
        }
    }

    for (var i in settings) {
        tasks.push(addSetting(settings[i]));
    }

    if (root.seedTasks) {
        seedTasks = root.seedTasks();
        tasks = tasks.concat(seedTasks);
    }

    Async.series(tasks, done);
};

internals.updateDb = function (root, done) {

    var Snack = root.snack,
        Models = Snack.models,
        schema = Snack.services.schema,
        settings = internals.settings('core'),
        tasks = [];

    tasks.push(function updateTables(next) {
        schema.autoupdate(next);
    });

    function updateSetting(sett) {

        return function (next) {
            Models.Setting.findOne({
                where: {
                    key: sett.key
                }
            }, function (err, setting) {
                setting.updateAttributes(sett, next);
            });
        }
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
        updateDb = internals.updateDb;

    var root = {};
    root.server = server;
    root.snack = Snack;

    Seed.register(root, function () {

        // Really awful test for uninitted db...
        var versionQuery = {
            where: {
                key: 'databaseVersion'
            }
        };

        Models.Setting.findOne(versionQuery, function (err, setting) {

            // If there's an error, or no setting, the assumption is
            // this hasn't been initted...
            if (err || !setting) {
                return freshDb(root, next);
            }

            if (setting.value !== defaultSettings.core.databaseVersion.value) {
                return updateDb(root, next);
            }

            next();
        });
    });
};

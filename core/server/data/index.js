var Hapi = require('hapi');
var Async = require('async');

var Seed = require('./seed');
var defaultSettings = require('./defaultSettings.json');

var internals = {};

internals.settings = function () {

    var settings = [],
        setting;

    for (var group in defaultSettings) {

        for (var key in defaultSettings[group]) {

            setting = {
                key: key,
                value: defaultSettings[group][key].value,
                group: group
            };

            settings.push(setting);
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
        sett
        tasks = [];

    tasks.push(function createTables(next) {
        schema.autoupdate(next);
    });

    for (var i in settings) {
        sett = settings[i];
        tasks.push(function addSetting(next) {
            setting = new Models.Setting(settings[i]);
            setting.save(function (err) {
                next(err);
            });
        });
    }

    if (root.seedTasks) {
        seedTasks = root.seedTasks();
        tasks = tasks.concat(seedTasks);
    }

    Async.series(tasks, done);
};

internals.updateDb = function (root, done) {

    var schema = Snack.services.schema;

    schema.autoupdate(function () {
        done();
    });
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

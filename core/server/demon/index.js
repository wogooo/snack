var path = require('path');
var Hapi = require('hapi');
var Utils = Hapi.utils;

var request = require('request');
var async = require('async');
var kue = require('kue');

var Config = require('../config')();

var internals = {};

internals.Demon = function (options) {

    options = options || {};

    this._settings = {};

    if (options.requirePath) {

        this._settings.requirePath = path.resolve(options.requirePath);
    }

    Utils.assert(options.queue, 'No queue settings defined!');

    if (options.queue.kue) {

        this.queue = this.usingKue(options.kue);
    }
};

internals.Demon.prototype.usingKue = function (settings) {

    var defaults = {
        disableSearch: true
    };

    var config = Utils.applyToDefaults(defaults, settings);

    return kue.createQueue(config);
};

internals.Demon.prototype.init = function (callback) {

    // Should load some config here...
    var names = ['image-processing'];
    this._require(names, {}, callback);
};

internals.Demon.prototype.results = function (api, results, callback) {

    var queue = this.queue;

    api.post(results, function (error, response, body) {
        console.log('posted!');
    });

    // queue.create('results', data).save();

    // request.post('http://localhost:8008/queue/results', {
    //     form: results
    // });
};

internals.Demon.prototype._register = function (plugin, options, callback) {

    var self = this;
    var queue = this.queue;

    var root = {};

    root.process = function (name, callback) {

        queue.process(name, function (job, done) {

            var data = job.data;
            var api = {};

            api.get = function (cb) {
                request({
                    method: 'GET',
                    uri: data.endpoint
                }, cb);
            };

            api.post = function (body, cb) {
                request({
                    method: 'POST',
                    uri: data.endpoint,
                    form: body
                }, cb);
            };

            callback(api, job, function (err, results) {

                done(err);

                if (!err) {
                    self.results(api, results);
                }
            });
        });
    };

    plugin.register.call(null, root, options || {}, function (err) {

        callback(err);
    });
};

internals.Demon.prototype._require = function (names, options, callback, requireFunc) {

    var self = this;

    requireFunc = requireFunc || require;

    var parse = function () {

        var registrations = [];

        names.forEach(function (item) {

            registrations.push({
                name: item,
                options: null
            });
        });

        async.forEachSeries(registrations, function (item, next) {

                load(item, next);
            },
            function (err) {

                return callback(err);
            });
    };

    var load = function (item, next) {

        var itemName = item.name;
        if (itemName[0] === '.') {
            itemName = path.join(__dirname, itemName);
        } else if (itemName[0] !== '/' &&
            self._settings.requirePath) {

            itemName = path.join(self._settings.requirePath, itemName);
        }

        var packageFile = path.join(itemName, 'package.json');

        var mod = requireFunc(itemName);
        var pkg = requireFunc(packageFile);

        var processor = {
            name: pkg.name,
            version: pkg.version,
            register: mod.register,
            path: internals.packagePath(pkg.name, packageFile)
        };

        self._register(processor, item.options, next);
    };

    parse();
};

internals.Demon.start = function () {

    var config = {
        requirePath: path.resolve(__dirname),
        queue: Config.queue
    };

    var demon = new internals.Demon(config);

    demon.init(function () {
        console.info('Demon ready 😈');
    });
};

internals.packagePath = function (name, packageFile) {

    var pkgPath = null;

    var keys = Object.keys(require.cache);
    for (var i = 0, il = keys.length; i < il; ++i) {
        var key = keys[i];
        if (key.indexOf(packageFile) === key.length - packageFile.length) {
            var record = require.cache[key];
            if (record.exports &&
                record.exports.name === name) {

                pkgPath = path.dirname(key);
                break;
            }
        }
    }

    return pkgPath;
};

module.exports = internals.Demon.start;

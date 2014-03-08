// This will probably go away... Not sure how where to store pack config yet,
// but they can be installed as node modules.

var Hapi = require('hapi');
var Utils = Hapi.utils;
var Config = require('../config');
var config = Config();
var Path = require('path');

// If path is omitted, it is presumed to be in node_modules,
// or some other path that work with `require('KEYNAME')`

var packs = {
    'snack-queue': {
        path: Path.resolve(__dirname, 'snack-queue'),
        options: {
            basePath: config.api.basePath + '/v' + config.api.version,
            kue: {
                disableSearch: true
            }
        }
    }
};

packs['snack-queue'].options = Utils.merge(packs['snack-queue'].options, config.queue);

var internals = {};

internals.init = function (server, next) {

    var loadPacks = {};
    var pack, packPath;

    for (var name in packs) {
        pack = packs[name];
        packPath = pack.path || name;
        loadPacks[packPath] = pack.options;
    }

    server.pack.require(loadPacks, next);
};

exports.init = internals.init;

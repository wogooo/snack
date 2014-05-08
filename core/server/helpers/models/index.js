var Hoek = require('hoek'),
    Enqueue = require('./enqueue');

var internals = {};

internals.checkDirty = function (fields, data, was) {

    var dirty = {},
        field;

    for (var f in fields) {

        field = fields[f];

        dirty[field] = false;

        if (data[field] !== was[field]) {
            dirty[field] = true;
        }
    }

    return dirty;
};

internals.extend = function (target, source) {

    for (var key in source) {
        if (source.hasOwnProperty(key)) {
            target[key] = source[key];
        }
    }

    for (var proto in source.prototype) {
        target.define(proto, source.prototype[proto]);
    }
};

internals.enqueue = function (server) {

    var options = {
        server: server,
        config: server.app.config
    };

    return new Enqueue(options);
};

module.exports = internals;

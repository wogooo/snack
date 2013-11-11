'use strict';

// Contrib modules
var r = require('rethinkdb');
var genericPool = require('generic-pool');

// User modules
var utils = require('./utils');

// Declare internals
var internals = {};

// Database constructor
internals.Database = function (settings) {

    var defaults = {
        // Basic rethink settings
        host: 'localhost',
        port: 28015,
        database: 'test',

        // Pooled connection settings
        maxConnections: 10,
        minConnections: 2,

        // specifies how long a resource can stay idle in pool before being removed
        connectionIdle: 30000
    };

    this.settings = utils.applyToDefaults(defaults, settings);
    this.pool = {};
};

internals.Database.prototype.connect = function (callback) {

    var settings = this.settings;

    r.connect({
        host: settings.host,
        port: settings.port,
        db: settings.database
    }, function (err, conn) {

        conn = conn || {};
        conn._id = Math.floor(Math.random() * 10001);

        if (err) throw err;

        callback(null, conn);
    });
};

internals.Database.prototype.createPool = function () {

    var settings = this.settings;
    var self = this;

    this.pool = genericPool.Pool({
        name: settings.database,
        create: function (callback) {
            self.connect(callback);
        },
        destroy: function (connection) {
            connection.close();
        },

        max: settings.maxConnections,
        min: settings.minConnections,
        idleTimeoutMillis: settings.connectionIdle,

        log: function (str, level) {
            // level = (level === 'verbose') ? 'debug' : level;
            // console[level](str);
        }
    });
};

internals.Database.prototype.destroyPool = function (callback) {

    var pool = this.pool;
    pool.drain(function () {
        pool.destroyAllNow();
        callback();
    });
};

internals.Database.prototype.close = function (callback) {

    this.destroyPool(callback);
};

// e95ace95-02ef-4bca-96de-0ad07b037934
// b4f7766b-6033-4b2c-a5ad-9065d68d047e
internals.Database.prototype.get = function (id, tableName, callback) {

    var pool = this.pool;

    pool.acquire(function (err, connection) {
        if (err) {

            if (err) throw err;

        } else {

            r.table(tableName)
                .get(id)
                .run(connection, function (err, result) {
                    if (err) throw err;

                    callback(err, result);
                    pool.release(connection);
                });
        }
    });
};

internals.Database.prototype.list = function (tableName, callback) {

    var pool = this.pool;

    pool.acquire(function (err, connection) {
        if (err) {
            // handle error - this is generally the err from your
            // factory.create function
        } else {

            r.table(tableName)
                .run(connection, function (err, cursor) {
                    if (err) throw err;

                    cursor.toArray(function (err, result) {
                        if (err) throw err;
                        callback(err, result);
                        pool.release(connection);
                    });
                });
        }
    });
};

internals.Database.prototype.create = function (data, tableName, callback) {

    var pool = this.pool;

    pool.acquire(function (err, connection) {
        if (err) {
            // handle error - this is generally the err from your
            // factory.create function
        } else {

            r.table(tableName)
                .insert(data)
                .run(connection, function (err, result) {
                    if (err) throw err;

                    callback(err, result);
                    pool.release(connection);
                });
        }
    });
};

internals.Database.prototype.destroy = function (id, tableName, callback) {

    var pool = this.pool;

    pool.acquire(function (err, connection) {
        if (err) {
            // handle error - this is generally the err from your
            // factory.create function
        } else {

            r.table(tableName)
                .get(id)
                .delete()
                .run(connection, function (err, result) {
                    if (err) throw err;

                    callback(err, result);
                    pool.release(connection);
                });
        }
    });
};

internals.Database.prototype.update = function (id, data, tableName, callback) {

    var pool = this.pool;

    pool.acquire(function (err, connection) {
        if (err) {
            // handle error - this is generally the err from your
            // factory.create function
        } else {

            r.table(tableName)
                .get(id)
                .update(data)
                .run(connection, function (err, result) {
                    if (err) throw err;

                    callback(err, result);
                    pool.release(connection);
                });
        }
    });
};

// Initialize a new database and return the instance when
// connected
internals.Database.init = function (settings) {

    var database = new internals.Database(settings);
    database.createPool();

    return database;
};

module.exports = internals.Database;

'use strict';

// Contrib modules
var async = require('async');
var _ = require('lodash');
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
        db: settings.database,
        authKey: settings.authKey
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

            return callback(err);

        } else {

            r.table(tableName)
                .get(id)
                .run(connection, function (err, result) {

                    if (err) {
                        return callback(err);
                    }

                    callback(err, result);
                    pool.release(connection);
                });
        }
    });
};

internals.Database.prototype.getAll = function (id, index, tableName, callback) {

    var pool = this.pool;

    var secondaryIndex = {
        index: 'id'
    };

    if (index) {
        secondaryIndex = {
            index: index
        };
    }

    var args = [];

    if (!_.isArray(id)) {
        args.push(id);
    } else {
        args = args.concat(id);
    }

    args.push(secondaryIndex);

    pool.acquire(function (err, connection) {
        if (err) {

            return callback(err);

        } else {

            var table = r.table(tableName);
            table
                .getAll
                .apply(table, args)
                .run(connection, function (err, cursor) {

                    if (err) {
                        return callback(err);
                    }

                    cursor.toArray(function (err, result) {

                        if (err) {
                            return callback(err);
                        }

                        callback(err, result);
                        pool.release(connection);
                    });
                });
        }
    });
};

internals.Database.prototype.getWithRelations = function (id, tableName, callback) {

    var self = this;
    var pool = this.pool;

    pool.acquire(function (err, connection) {

        self.get(id, tableName, function (err, post) {

            var index = 'postId';
            pool.release(connection);

            self.getAll(id, index, 'relation', function (err, relations) {

                var relationItems = [];
                var relationTable;

                relations.forEach(function (row) {
                    var prop;
                    for (prop in row) {
                        if (prop.substr(-2) === 'Id' && prop !== index) {

                            relationTable = prop.substr(0, prop.length - 2);

                            post[relationTable] = post[relationTable] || {
                                items: []
                            };

                            relationItems.push({
                                table: relationTable,
                                id: row[prop]
                            });
                        }
                    }
                });

                async.each(relationItems,
                    function (item, cb) {
                        self.get(item.id, item.table, function (err, relationItem) {
                            post[item.table].items.push(relationItem);
                            cb(err);
                        });
                    },
                    function (err) {
                        callback(err, post);
                    }
                );
            });
        });
    });
};

internals.Database.prototype.list = function (tableName, callback) {

    var pool = this.pool;

    pool.acquire(function (err, connection) {
        if (err) {

            return callback(err);

        } else {

            r.table(tableName)
                .run(connection, function (err, cursor) {

                    if (err) {
                        return callback(err);
                    }

                    cursor.toArray(function (err, result) {

                        if (err) {
                            return callback(err);
                        }

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

            return callback(err);

        } else {

            r.table(tableName)
                .insert(data)
                .run(connection, function (err, result) {

                    if (err) {
                        return callback(err);
                    }

                    if (typeof (callback) === 'function') {
                        callback(err, result);
                    }

                    pool.release(connection);
                });
        }
    });
};

internals.Database.prototype.destroy = function (id, tableName, callback) {

    var pool = this.pool;

    pool.acquire(function (err, connection) {
        if (err) {

            return callback(err);

        } else {

            r.table(tableName)
                .get(id)
                .delete()
                .run(connection, function (err, result) {

                    if (err) {
                        return callback(err);
                    }

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

            return callback(err);

        } else {

            r.table(tableName)
                .get(id)
                .update(data)
                .run(connection, function (err, result) {

                    if (err) {
                        return callback(err);
                    }

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

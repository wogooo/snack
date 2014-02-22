'use strict';

var resolve = require('path').resolve;

// If path is omitted, it is presumed to be in node_modules,
// or some other path that work with `require('KEYNAME')`

var packs = {
    'snack-queue': {
        path: resolve(__dirname, 'snack-queue'),
        options: {
            kue: {
                host: 'localhost',
                port: 6379,
                disableSearch: true
            }
        }
    },
    'snack-api': {
        options: {
            db: {
                engine: 'rethink',
                host: 'localhost',
                port: 28015,
                database: 'test',
                maxConnections: 10,
                minConnections: 2,
                connectionIdle: 30000
            }
        },
        path: resolve(__dirname, 'snack-api')
    }
};

module.exports = packs;

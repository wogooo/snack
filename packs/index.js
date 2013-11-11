'use strict';

var resolve = require('path').resolve;

// If path is omitted, it is presumed to be in node_modules,
// or some other path that work with `require('KEYNAME')`
module.exports = {

    'furball': {
        'permissions': {
            'views': true
        },
        'options': {}
    },

    'lout': {
        'permissions': {
            'views': true,
            'routes': true
        },
        'options': {
            'endpoint': '/docs'
        }
    },

    'sample': {
        'permissions': {
            'views': true,
            'routes': true
        },
        'options': {
            'db': {
                engine: 'rethinkdb',
                host: 'localhost',
                port: 28015,
                database: 'test',
                maxConnections: 10,
                minConnections: 2,
                connectionIdle: 30000
            }
        },
        'path': resolve(__dirname, 'sample')
    }
};

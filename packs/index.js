'use strict';

var resolve = require('path').resolve;

var _ = require('lodash');

var config = require('../config');


// If path is omitted, it is presumed to be in node_modules,
// or some other path that work with `require('KEYNAME')`

var packs = {

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

packs.sample.options = _.extend(packs.sample.options || {}, config);

module.exports = packs;

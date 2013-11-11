'use strict';

// Better console
require('consoleplusplus');

// Config exports
var config = require('./config');

// Set log level
var logLevel = config.server.logLevel ? config.server.logLevel.toUpperCase() : 'ERROR';
console.setLevel(console.LEVELS[logLevel]);

// The server
var server = require('./lib/server');

// Init the server
server.init(config);

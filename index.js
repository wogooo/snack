'use strict';

// Better console
require('consoleplusplus');

// Core
var cluster = require('cluster');

// Config exports
var config = require('./config');

// Set log level
var logConfig = config.log || {};
var logLevel = logConfig.level ? logConfig.level.toUpperCase() : 'ERROR';
console.setLevel(console.LEVELS[logLevel]);

// The server
var server = require('./lib/server');

// Init the server
server.init(cluster, config);

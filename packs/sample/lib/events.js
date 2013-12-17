'use strict';

// Core
var EventEmitter = require('events').EventEmitter;

// User
var utils = require('./utils');

// Declare internals
var internals = {};

internals.Events = function () {};

utils.inherits(internals.Events, EventEmitter);

module.exports = internals.Events;

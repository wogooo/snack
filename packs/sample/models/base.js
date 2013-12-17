'use strict';

// Core
var EventEmitter = require('events').EventEmitter;

//  User
var utils = require('../lib/utils');

// Base class
var Base = function () {};

// Incorporate eventEmitter
utils.inherits(Base, EventEmitter);

// Export
module.exports = Base;

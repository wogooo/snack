// Core modules
var util = require('util');

// Contrib modules
var hoek = require('hoek');
var _ = require('lodash');

// Declare internals
var internals = {};

// Import Hoek Utilities
internals.import = function () {

  for (var h in hoek) {
    if (hoek.hasOwnProperty(h)) {
      exports[h] = hoek[h];
    }
  }

  for (var u in _) {
    if (_.hasOwnProperty(u)) {
      exports[u] = _[u];
    }
  }
};

internals.import();

exports.inherits = util.inherits;

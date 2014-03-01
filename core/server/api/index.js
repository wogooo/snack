/*jshint sub:true*/

var Hapi = require('hapi');
var Utils = Hapi.utils;

var requires = {};

Utils.loadDirModules(__dirname, ['index'], requires);

exports.init = function (server, next) {

    Object.keys(requires).forEach(function (requireName) {
        exports[requireName] = requires[requireName];
    });

    next();
};

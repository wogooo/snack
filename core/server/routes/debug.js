var Path = require('path');
var Hapi = require('hapi');

module.exports = function (route) {

    var server = route.server;
    var Snack = server.app;
    var checkPermission = Snack.permissions.check;

};

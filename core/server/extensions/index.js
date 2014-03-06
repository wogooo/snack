/*jshint sub:true*/

var Hapi = require('hapi');
var Utils = Hapi.utils;

var internals = {};

internals.deepen = function deepen(o) {
    var oo = {}, t, parts, part, nextPart;

    var boundaries = /[\.\[]/;
    var closeArr = /\]$/;
    var count = 0;
    var key;

    for (var k in o) {

        part = void(0);
        nextPart = void(0);

        t = oo;
        parts = k.split(boundaries);
        key = parts.pop();

        for (var i = 0; i < parts.length; i++) {

            part = parts[i];
            nextPart = parts[i + 1];

            if (!t[part] && closeArr.test(nextPart)) {

                t = t[part] = [];

            } else {

                if (closeArr.test(part)) {
                    part = part.substring(0, part.length - 1);
                }

                t = t[part] = t[part] || {};
            }
        }

        t[key] = o[k];
    }

    return oo;
};

internals.newDeepen = function newDeepen(o) {
    console.log(o);

    var oo = {}, t, parts, part, nextPart;

    var boundaries = /[\.\[]/;
    var closeArr = /\]$/;
    var count = 0;
    var key;

    for (var k in o) {

        part = void(0);
        nextPart = void(0);

        t = oo;
        parts = k.split(boundaries);

        console.log(k, boundaries);

        key = parts.pop();

        for (var i = 0; i < parts.length; i++) {

            part = parts[i];
            nextPart = parts[i + 1];

            if (!t[part] && closeArr.test(nextPart)) {

                t = t[part] = [];

            } else {

                if (closeArr.test(part)) {
                    part = part.substring(0, part.length - 1);
                }

                t = t[part] = t[part] || {};
            }
        }

        t[key] = o[k];
    }

    return oo;
};

exports.init = function (server, next) {

    // server.ext('onPreHandler', function (request, next) {

    //     if (request.method === 'post' || request.method === 'put') {
    //         // request.payload = internals.newDeepen(request.payload);
    //     }

    //     next();
    // });

    next();
};

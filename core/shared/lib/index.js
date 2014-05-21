var Fs = require('fs');

var internals = {};

internals.testPaths = function (paths, done) {

    var testPath,
        manyPaths;

    if (paths instanceof Array && paths.length) {

        manyPaths = true;
        testPath = paths.shift();

    } else {

        testPath = paths;
    }

    Fs.stat(testPath, function (err, stats) {

        if (stats && stats.isDirectory()) {

            return done(null, testPath);

        } else if (manyPaths && paths.length) {

            internals.testPaths(paths, done);

        } else {

            done(err);
        }
    });
};

internals.isUUID = function (str) {

    var regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return regex.test(str);
};

module.exports = internals;

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

module.exports = internals;

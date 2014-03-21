var Fs = require('fs-extra');
var Hapi = require('hapi');
var Crypto = require('crypto');
var Path = require('path');
var Async = require('async');
var Mime = require('mime');
var Size = require('image-size');

var Config = require('../config');

var internals = {};

internals.typeOfFile = function (mimeType) {

    var imageTypes = {
        'image/gif': true,
        'image/jpeg': true,
        'image/png': true,
        'image/tiff': true,
        'image/webp': true,
        'image/vnd.adobe.photoshop': true,
        'image/bmp': true
    };

    if (imageTypes[mimeType]) {
        return 'image';
    }

    return;
};

// internals.writeFile = function (oldPath, newPath, done) {

//     var basename = Path.basename(newPath);
//     var newDirs = newPath.replace(basename, '');

//     Fs.mkdirs(newDirs, function (err) {

//         if (err) return done(err);

//         Fs.rename(oldPath, newPath, function (err) {

//             done(err);
//         });
//     });
// };

internals.writeFile = function (stream, path, done) {

    var basename = Path.basename(path),
        dirs = path.replace(basename, ''),
        md5sum = Crypto.createHash('md5'),
        etag;

    Fs.mkdirs(dirs, function (err) {

        if (err) return done(err);

        // internals.writeFile(file.path, newPath, finalize);
        var write = Fs.createWriteStream(path);

        stream.pipe(write);

        stream.on('data', function (chunk) {
            md5sum.update(chunk);
        });

        stream.on('error', function () {
            done(Hapi.error.badImplementation('Error reading file'));
        });

        stream.on('end', function () {
            etag = md5sum.digest('hex');
            write.end();
        });

        write.on('finish', function () {
            done(null, etag);
        });
    });
};

internals._storeFile = function (stream, file, done) {

    var filename = file.filename,
        assetsPath = Config().paths.assetsPath,
        writePath = Path.join(assetsPath, file.key),
        mimeType,
        typeOfFile,
        dimensions,
        etag,
        fileObj;

    var finalize = function (err, etag) {

        if (err) return done(err);

        mimeType = Mime.lookup(writePath);

        fileObj = {
            filename: Path.basename(writePath),
            etag: etag,
            key: file.key,
            bytes: file.bytes,
            mimetype: mimeType,
            createdAt: file.createdAt,
            storage: 'local'
        };

        typeOfFile = internals.typeOfFile(mimeType);

        if (typeOfFile === 'image') {
            dimensions = Size(writePath);
            fileObj.height = dimensions.height || 0;
            fileObj.width = dimensions.width || 0;
        }

        done(null, fileObj);
    };

    internals.writeFile(stream, writePath, finalize);
};

internals.save = function (stream, file, done) {

    // var files = [];

    // if (fileObjOrArr instanceof Array) {

    //     var fileArr = fileObjOrArr;

    //     Async.eachSeries(fileArr, function (file, next) {

    //             internals._storeFile(file, function (err, fileObj) {
    //                 if (err) return next(err);

    //                 files.push(fileObj);
    //                 next();
    //             });
    //         },
    //         function (err) {
    //             if (err) return done(err);

    //             done(null, files);
    //         });

    // } else {

    //     var file = fileObjOrArr;

    internals._storeFile(stream, file, function (err, file) {

        if (err) return done(err);

        done(null, file);
    });
    // }
};

internals.exists = function (key, done) {

    var assetsPath = Config().paths.assetsPath,
        assetPath = Path.join(assetsPath, key);

    Fs.exists(assetPath, done);
};

module.exports = function (storage, next) {

    storage.exports.Local = {
        save: function (stream, file, cb) {
            internals.save(stream, file, cb);
        },
        exists: function (stream, file, cb) {
            internals.exists(stream, file, cb);
        }
    };

    next();
};

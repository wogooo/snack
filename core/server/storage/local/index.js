var Fs = require('fs-extra');
var Url = require('url');
var Hapi = require('hapi');
var Crypto = require('crypto');
var Path = require('path');
var Async = require('async');
var Mime = require('mime');
var Size = require('image-size');

var Config = require('../../config');

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

internals.writeFile = function (fileStream, path, done) {

    var basename = Path.basename(path),
        dirs = path.replace(basename, ''),
        md5sum = Crypto.createHash('md5'),
        etag;

    Fs.mkdirs(dirs, function (err) {

        if (err) return done(err);

        var writeStream = Fs.createWriteStream(path);

        fileStream.pipe(writeStream);

        fileStream.on('data', function (chunk) {
            md5sum.update(chunk);
        });

        fileStream.on('error', function () {
            done(Hapi.error.badImplementation('Error reading file'));
        });

        fileStream.on('end', function () {
            etag = md5sum.digest('hex');
            writeStream.end();
        });

        writeStream.on('finish', function () {
            done(null, etag);
        });
    });
};

internals._storeFile = function (fileStream, fileData, done) {

    var assetsPath = Config().paths.assetsPath,
        writePath = Path.join(assetsPath, fileData.key),
        typeOfFile,
        dimensions;

    var finalize = function (err, etag) {

        if (err) return done(err);

        fileData.etag = etag;
        fileData.storage = 'local';
        fileData.url = Config.urlFor('asset', {
            asset: fileData
        }, true);

        typeOfFile = internals.typeOfFile(fileData.mimetype);

        if (typeOfFile === 'image') {
            dimensions = Size(writePath);
            fileData.height = dimensions.height || 0;
            fileData.width = dimensions.width || 0;
        }

        done(null, fileData);
    };

    internals.writeFile(fileStream, writePath, finalize);
};

internals.save = function (fileStream, fileData, done) {

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

    internals._storeFile(fileStream, fileData, function (err, fileData) {

        if (err) return done(err);

        done(null, fileData);
    });
    // }
};

internals.exists = function (key, done) {

    var assetsPath = Config().paths.assetsPath,
        assetPath = Path.join(assetsPath, key);

    Fs.exists(assetPath, done);
};

exports.register = function (storage, options, next) {

    storage.provider({
        save: function (fileStream, fileData, cb) {
            internals.save(fileStream, fileData, cb);
        },
        exists: function (fileKey, cb) {
            internals.exists(fileKey, cb);
        },
        update: function (fileData, cb) {
            cb();
            // internals.exists(fileData, cb);
        },
        destroy: function (fileKey, cb) {
            cb();
        }
    });

    next();
};

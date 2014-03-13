var Fs = require('fs-extra');
var Path = require('path');
var Async = require('async');
var Mime = require('mime');
var Size = require('image-size');

var Config = require('../config');

var internals = {};

internals.typeOfAsset = function (mimeType) {

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

internals.writeFile = function (oldPath, newPath, done) {

    var basename = Path.basename(newPath);
    var newDirs = newPath.replace(basename, '');

    Fs.mkdirs(newDirs, function (err) {

        if (err) return done(err);

        Fs.rename(oldPath, newPath, function (err) {

            done(err);
        });
    });
};

internals._createAsset = function (file, done) {

    var filename = file.filename,
        assetsPath = Config().paths.assetsPath,
        newPath = Path.join(assetsPath, file.key),
        mimeType,
        typeOfAsset,
        fileData = {},
        dimensions,
        assetObj;

    var finalize = function (err) {

        if (err) return done(err);

        mimeType = Mime.lookup(newPath);
        typeOfAsset = internals.typeOfAsset(mimeType);

        if (typeOfAsset === 'image') {
            dimensions = Size(newPath);
            fileData.height = dimensions.height || 0;
            fileData.width = dimensions.width || 0;
        }

        assetObj = {
            filename: Path.basename(newPath),
            key: file.key,
            bytes: file.bytes,
            mimetype: mimeType,
            data: fileData,
            createdAt: file.createdAt,
            storage: 'local'
        };

        done(null, assetObj);
    };

    internals.writeFile(file.path, newPath, finalize);
};

internals.save = function (fileObjOrArr, done) {

    var assets = [];

    if (fileObjOrArr instanceof Array) {

        var fileArr = fileObjOrArr;

        Async.eachSeries(fileArr, function (fileObj, next) {

                internals._createAsset(fileObj, function (err, asset) {
                    if (err) return next(err);

                    assets.push(asset);
                    next();
                });
            },
            function (err) {
                if (err) return done(err);

                done(null, assets);
            });

    } else {

        var fileObj = fileObjOrArr;

        internals._createAsset(fileObj, function (err, asset) {
            if (err) return next(err);

            assets.push(asset);
            done(null, assets);
        });
    }
};

internals.exists = function (key, done) {

    var assetsPath = Config().paths.assetsPath,
        assetPath = Path.join(assetsPath, key);

    Fs.exists(assetPath, done);
};

module.exports = function (server) {

    return {
        save: internals.save,
        exists: internals.exists
    };
};

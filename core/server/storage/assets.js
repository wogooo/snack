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

internals.finalize = function (oldPath, newPath, done) {

    var basename = Path.basename(newPath);
    var newDirs = newPath.replace(basename, '');

    Fs.mkdirs(newDirs, function (err) {
        if (err) return done(err);

        Fs.rename(oldPath, newPath, function (err) {
            if (err) return done(err);
            done(err, newPath);
        });
    });
};

internals.createAsset = function (fileObj, done) {

    fileObj.createdAt = new Date();

    var assetsPath = Config().paths.assetsPath;
    var assetKey = Config.keyForAsset(fileObj);
    var newPath = Path.join(assetsPath, assetKey);

    internals.finalize(fileObj.path, newPath, function (err, newPath) {
        if (err) return next(err);

        var mimeType = Mime.lookup(newPath);
        var typeOfAsset = internals.typeOfAsset(mimeType);

        var data = {};

        if (typeOfAsset === 'image') {
            var dim = Size(newPath);
            data.height = dim.height || 0;
            data.width = dim.width || 0;
        }

        var assetObj = {
            filename: Path.basename(newPath),
            key: assetKey,
            bytes: fileObj.bytes,
            mimetype: mimeType,
            data: data,
            createdAt: fileObj.createdAt,
            storage: 'local'
        };

        done(null, assetObj);
    });
};

internals.save = function (fileObjOrArr, done) {

    var assets = [];

    if (fileObjOrArr instanceof Array) {

        var fileArr = fileObjOrArr;

        Async.eachSeries(fileArr, function (fileObj, next) {

                internals.createAsset(fileObj, function (err, asset) {
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

        internals.createAsset(fileObj, function (err, asset) {
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

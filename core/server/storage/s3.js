var internals = {};

var Fs = require('fs');
var AWS = require('aws-sdk');
var Url = require('url');

var internals = {};

internals.S3 = function (storage, options) {

    options = options || {};

    this.server = storage.server;
    this.hapi = storage.hapi;
    this.utils = this.hapi.utils;

    this._settings = {};

    var Utils = this.utils;

    Utils.assert(options.credentials, 'No AWS credentials provided!');
    Utils.assert(options.bucket, 'No S3 bucket defined!');

    AWS.config.update(options.credentials);

    this._settings.bucket = options.bucket;
    this._settings.url = options.url;

    this.client = new AWS.S3();
};

/*
    Simple check to make sure the bucket is ready
*/
internals.S3.prototype.ready = function (done) {

    var settings = this._settings;
    var client = this.client;

    client.headBucket({
        Bucket: settings.bucket
    }, function (err) {
        done(err);
    });
};

/*
    Check if an object exists on S3.
*/
internals.S3.prototype.exists = function (fileKey, done) {

    var settings = this._settings;
    var client = this.client;

    var data = {
        Bucket: settings.bucket,
        Key: fileKey
    };

    client.headObject(data, function (err, res) {
        if (err) return done(err);

        done(null, Boolean(res));
    });
};

/*
    Put a new object on S3.
*/
internals.S3.prototype.put = function (fileStream, fileData, done) {

    var settings = this._settings;
    var client = this.client;

    var data = {
        ACL: 'public-read',
        Bucket: settings.bucket,
        Key: fileData.key,
        Body: fileStream,
        ContentType: fileData.mimetype,
        ContentLength: fileData.bytes
    };

    client.putObject(data, function (err, res) {
        if (err) return done(err);

        // res = { ETag: '"ec1c6e9a89c47eabd992445c27052e69"' }
        fileData.etag = res.ETag.replace('"', '');
        fileData.storage = 's3';
        fileData.url = Url.resolve(settings.url, fileData.key);

        done(null, fileData);
    });
};

/*
    Update the ACL of an object on S3
*/
internals.S3.prototype.update = function (fileData, done) {

    var self = this;

    var Hapi = this.hapi;
    var settings = this._settings;
    var client = this.client;

    var data = {
        ACL: fileData.deleted ? 'private' : 'public-read',
        Bucket: settings.bucket,
        Key: fileData.key
    };

    this.existsS3(fileData.key, function (err, exists) {

        if (exists) {

            client.putObjectAcl(data, function (err, res) {
                done(err);
            });

        } else {

            done(Hapi.error.badImplementation('File does not exist on S3'));
        }
    });
};

/*
    Delete an object from S3 if it exists.
*/
internals.S3.prototype.destroy = function (fileKey, done) {

    var settings = this._settings;
    var client = this.client;

    var data = {
        Bucket: settings.bucket,
        Key: fileKey
    };

    this.existsS3(fileKey, function (err, exists) {

        if (exists) {

            client.deleteObject(data, function (err, res) {
                done(err);
            });

        } else {

            done(Hapi.error.badImplementation('File does not exist on S3'));
        }
    });
};

module.exports = function (storage, next) {

    var Providers = storage.providers;
    var Server = storage.server;
    var Snack = storage.snack;
    var Config = Snack.config;

    var options = Config().storage;

    var S3 = new internals.S3(storage, options);

    S3.ready(function (err) {

        if (err) {
            Server.log(['error', 'plugin'], 'S3 storage adapter not ready');
            return next(err);
        }

        Providers.S3 = {
            save: function (fileStream, fileData, cb) {
                S3.put(fileStream, fileData, cb);
            },
            update: function (fileAsset, cb) {
                S3.update(fileAsset, cb);
            },
            exists: function (fileKey, cb) {
                S3.exists(fileKey, cb);
            },
            destroy: function (fileKey, cb) {
                S3.destroy(fileKey, cb);
            }
        };

        next();
    });
};

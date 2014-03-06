var Fs = require('fs');
var Path = require('path');
var AWS = require('aws-sdk');
var Request = require('request');

var internals = {};

internals.SendToS3 = function (demon, options) {

    options = options || {};

    this.hapi = demon.hapi;
    this.utils = this.hapi.utils;
    this.config = demon.config;

    this._settings = {};

    var Utils = this.utils;

    Utils.assert(options.credentials, 'No AWS credentials provided!');
    Utils.assert(options.bucket, 'No S3 bucket defined!');

    AWS.config.update(options.credentials);

    this._settings.bucket = options.bucket;
    this._settings.url = options.url;

    this.client = new AWS.S3();
};

internals.SendToS3.prototype.updateAsset = function (asset, etag, done) {

    var settings = this._settings;
    var Config = this.config;

    var uri = Config.urlFor('api', {
        api: {
            type: 'asset',
            id: asset.id
        }
    }, true);

    var update = {
        etag: etag,
        storage: 'S3',
        url: settings.url + '/' + asset.path
    };

    Request.put(uri, {
        form: update
    }, function (err, res, payload) {

        done(err);
    });
};

internals.SendToS3.prototype.putS3 = function (asset, done) {

    var Config = this.config;

    var settings = this._settings;
    var client = this.client;

    var assetsPath = Config().paths.assetsPath;
    var assetPath = Path.join(assetsPath, asset.path);

    var stream = Fs.createReadStream(assetPath);

    var data = {
        Bucket: settings.bucket,
        Key: asset.path,
        Body: stream,
        ContentType: asset.mimetype
    };

    client.putObject(data, function (err, res) {
        if (err) return done(err);

        // res = { ETag: '"ec1c6e9a89c47eabd992445c27052e69"' }
        done(null, res.ETag.replace('"', ''));
    });
};

internals.SendToS3.prototype.fetchData = function (item, done) {

    var config = this.config;

    var uri = config.urlFor('api', {
        api: {
            type: item.type,
            id: item.id
        }
    }, true);

    Request.get(uri, function (err, res, payload) {

        if (err) return done(err);

        var data = JSON.parse(payload);

        done(null, data);
    });
};

internals.SendToS3.prototype.handler = function (job, done) {

    var self = this;

    this.fetchData(job.data, function (err, asset) {

        self.putS3(asset, function (err, etag) {

            self.updateAsset(asset, etag, done);
        });
    });

};

module.exports = internals.SendToS3;

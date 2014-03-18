var Fs = require('fs');
var Path = require('path');
var AWS = require('aws-sdk');
var Nipple = require('nipple');

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

/*
    Simple check to make sure the bucket is ready
*/
internals.SendToS3.prototype.ready = function (done) {

    var settings = this._settings;
    var client = this.client;

    client.headBucket({
        Bucket: settings.bucket
    }, function (err) {
        done(err);
    });
};

/*
    Send back what we got from S3 to Snack.
*/
internals.SendToS3.prototype.updateAsset = function (asset, etag, done) {

    var settings = this._settings;
    var Config = this.config;

    var uri = Config.urlFor('api', {
        api: {
            type: 'asset',
            id: asset.id,
            format: 'json'
        }
    }, true);

    var update = {
        etag: etag,
        storage: 'S3',
        url: settings.url + '/' + asset.key
    };

    Nipple.put(uri, {
        payload: JSON.stringify(update)
    }, function (err, res, payload) {

        done(err);
    });

};

/*
    Check if an object exists on S3.
*/
internals.SendToS3.prototype.existsS3 = function (asset, done) {

    var settings = this._settings;
    var client = this.client;

    var data = {
        Bucket: settings.bucket,
        Key: asset.key
    };

    client.headObject(data, function (err, res) {
        if (err) return done(err);

        done(null, Boolean(res));
    });
};

/*
    Put a new object on S3.
*/
internals.SendToS3.prototype.putS3 = function (asset, done) {

    var Config = this.config;

    var settings = this._settings;
    var client = this.client;

    var assetsPath = Config().paths.assetsPath;
    var assetPath = Path.join(assetsPath, asset.key);

    var stream = Fs.createReadStream(assetPath);

    var data = {
        ACL: asset.deleted ? 'private' : 'public-read',
        Bucket: settings.bucket,
        Key: asset.key,
        Body: stream,
        ContentType: asset.mimetype
    };

    client.putObject(data, function (err, res) {
        if (err) return done(err);

        // res = { ETag: '"ec1c6e9a89c47eabd992445c27052e69"' }
        done(null, res.ETag.replace('"', ''));
    });
};

/*
    Update the ACL of an object on S3
*/
internals.SendToS3.prototype.updateS3 = function (asset, done) {

    var self = this;

    var settings = this._settings;
    var client = this.client;

    var data = {
        ACL: asset.deleted ? 'private' : 'public-read',
        Bucket: settings.bucket,
        Key: asset.key
    };

    this.existsS3(asset, function (err, exists) {

        if (exists) {

            client.putObjectAcl(data, function (err, res) {
                done(err);
            });

        } else {

            self.putS3(asset, done);
        }
    });
};

/*
    Delete an object from S3 if it exists.
*/
internals.SendToS3.prototype.deleteS3 = function (asset, done) {

    var settings = this._settings;
    var client = this.client;

    var data = {
        Bucket: settings.bucket,
        Key: asset.key
    };

    this.existsS3(asset, function (err, exists) {

        if (exists) {

            client.deleteObject(data, function (err, res) {
                done(err);
            });

        } else {

            done(err);
        }
    });
};

/*
    Get some data from Snack based on an id.
*/

internals.SendToS3.prototype.fetchData = function (item, done) {

    var Config = this.config;

    var uri = Config.urlFor('api', {
        api: {
            type: item.type,
            id: item.id
        }
    }, true);

    Nipple.get(uri, function (err, res, payload) {

        if (err) return done(err);

        var data = JSON.parse(payload);

        done(null, data);
    });
};

internals.SendToS3.prototype.handler = function (job, next) {

    var self = this;

    if (job.type === 'asset.destroyed') {

        if (job.data.obj) {

            var asset = JSON.parse(job.data.obj);

            self.deleteS3(asset, function (err) {

                next(err);
            });

        } else {

            next();
        }

        return;
    }

    this.fetchData(job.data, function (err, asset) {

        if (job.type === 'asset.created') {
            self.putS3(asset, function (err, etag) {

                self.updateAsset(asset, etag, next);
            });

            return;
        }

        if (job.type === 'asset.updated' || job.type === 'asset.deleted') {
            self.updateS3(asset, function (err) {

                next(err);
            });

            return;
        }

        next();
    });
};

module.exports = internals.SendToS3;

var Async = require('async');

var Storage = require('../storage');
var models = require('../models').models;

var assets = {};

assets.list = function list(args, done) {

    models.Asset.all(function (err, assets) {
        if (err) {
            return done(err);
        }

        done(null, assets);
    });
};

assets.create = function create(args, done) {

    var payload = args.payload;

    if (payload.items) {

        var assets = [],
            asset;

        Storage.Assets.save(payload.items, function (err, assetObjs) {

            Async.each(assetObjs,
                function (assetObj, next) {

                    assetObj.title = payload.title;
                    assetObj.description = payload.description;

                    asset = new models.Asset(assetObj);

                    asset.save(function (err, a) {
                        if (err) return next(err);

                        assets.push(a.toJSON(true));
                        next();
                    });
                },
                function (err) {
                    if (err) return done(err);

                    done(null, assets);
                });
        });

    } else {

        done (new Error('No assets provided.'));
    }
};

assets.read = function read(args, done) {

    var params = args.params;

    models.Asset.find(params.id, function (err, asset) {
        if (err) {
            return done(err);
        }

        if (!asset) {
            return done(new Error('Not found!'));
        }

        done(err, asset.toJSON(true));
    });
};

assets.update = function update(args, done) {

    var query = args.query;
    var params = args.params;
    var payload = args.payload;

    models.Asset.find(params.id, function (err, asset) {
        if (err) {
            return done(err);
        }

        if (!asset) {
            return done(new Error('Record not found.'));
        }

        if (payload.timestamp) {

            // Timestamp versioning in effect, compare
            if (asset.timestamp > params.timestamp) {
                return done(new Error('Version mismatch.'));
            }
        }

        if (query.clearQueue === 'true') {

            // Pass in the private queue clearing flag
            asset.__data.clearQueue = true;
        }

        asset.updateAttributes(payload, function (err, results) {

            done(err, results ? results.toJSON(true) : null);
        });
    });
};

assets.destroy = function destroy(args, done) {

    var query = args.query;
    var params = args.params;

    models.Asset.find(params.id, function (err, asset) {
        if (err) {
            return done(err);
        }

        if (!asset) {
            return done(new Error('Record not found.'));
        }

        if (query.destroy === 'true') {

            // A true destructive delete
            asset.destroy(function (err) {
                done(err);
            });

        } else {

            // A more commons setting to make it unavailable
            asset.updateAttributes({
                available: false
            }, function (err) {
                done(err);
            });
        }
    });
};

module.exports = assets;

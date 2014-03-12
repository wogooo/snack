var Async = require('async');
var Hapi = require('hapi');
var Utils = Hapi.utils;

var internals = {};

internals.Assets = function (options) {

    this.config = options.snack.config;
    this.models = options.snack.models.models;
    this.storage = options.snack.storage;
    this.api = options.api;
};

internals.Assets.prototype.list = function (args, done) {

    var Models = this.models;

    Models.Asset.all(function (err, assets) {
        if (err) {
            return done(err);
        }

        done(null, assets);
    });
};

internals.Assets.prototype.create = function (args, done) {

    var Models = this.models;
    var Api = this.api;
    var Storage = this.storage;
    var Config = this.config;

    var payload = args.payload;

    var multi = true,
        assets = [],
        asset,
        files = [],
        items = [],
        item;

    // Can create 1 or many assets at once.
    if (payload.items) {

        payload.items.forEach(function (item) {
            files.push(item.file);
            delete item.file;

            items.push(item);
        });

    } else if (payload.file) {

        // Can't have that in there...
        files.push(payload.file);
        delete payload.file;

        items.push(payload);
        multi = false;

    } else {

        return done(new Error('No files to process.'));
    }

    // Save our files, always returns an array.
    Storage.Assets.save(files, function (err, files) {
        if (err) return done(err);

        // Handle each file in order, turning into assets
        Async.eachSeries(files, function (file, next) {

                item = items.shift();

                // Create an asset url from the file obj
                item.url =  Config.urlFor('asset', {
                    asset: file
                }, true);

                // Merge file props onto
                // item properties (title, description).
                item = Utils.merge(item, file);

                // Finally, create an asset instance
                asset = new Models.Asset(item);

                asset.save(function (err, a) {
                    if (err) return next(err);

                    assets.push(a);
                    next();
                });
            },
            function (err) {
                if (err) return done(err);

                // Queue everything up.
                Api.Base.enqueue(assets, 'asset.created', function (err) {
                    if (err) return done(err);

                    done(err, multi ? assets : assets[0]);
                });
            });
    });
};



internals.Assets.prototype.read = function (args, done) {

    var Models = this.models;

    var params = args.params;

    Models.Asset.find(params.id, function (err, asset) {
        if (err) {
            return done(err);
        }

        if (!asset) {
            return done(new Error('Not found!'));
        }

        done(err, asset.toJSON(true));
    });
};

internals.Assets.prototype.update = function (args, done) {

    var Api = this.api;
    var Models = this.models;

    var query = args.query;
    var params = args.params;
    var payload = args.payload;

    var clearQueue = false;
    if (query.clearQueue === 'true') {
        clearQueue = true;
    }

    Models.Asset.find(params.id, function (err, asset) {

        if (err) return done(err);

        if (!asset) {
            return done(new Error('Record not found.'));
        }

        if (payload.timestamp) {

            // Timestamp versioning in effect, compare
            if (asset.timestamp !== payload.timestamp) {
                return done(new Error('Version mismatch.'));
            }
        }

        if (asset.queue && clearQueue) {

            // Pass in the private queue clearing flag
            asset.__data.clearQueue = clearQueue;
        }

        asset.updateAttributes(payload, function (err, asset) {

            if (!asset.queue && !clearQueue) {

                Api.Base.enqueue(asset, 'asset.updated', function (err) {

                    if (err) return done(err);

                    done(err, asset ? asset.toJSON() : null);
                });

            } else {

                done(err, asset ? asset.toJSON() : null);
            }
        });
    });
};

internals.Assets.prototype.destroy = function (args, done) {

    var Api = this.api;
    var Models = this.models;

    var query = args.query;
    var params = args.params;

    Models.Asset.find(params.id, function (err, asset) {
        if (err) {
            return done(err);
        }

        if (!asset) {
            return done(new Error('Record not found.'));
        }

        if (query.destroy === 'true') {

            // A true destructive delete
            asset.destroy(function (err) {
                Api.Base.enqueue(asset, 'asset.destroyed', function (err) {
                    done(err);
                });
            });

        } else {

            // A more commons setting to make it unavailable
            asset.updateAttributes({
                deleted: true
            }, function (err) {
                Api.Base.enqueue(asset, 'asset.deleted', function (err) {
                    done(err);
                });
            });
        }
    });
};

module.exports = function (root) {

    var assets = new internals.Assets(root);
    return assets;
};


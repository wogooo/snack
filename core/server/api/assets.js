var Path = require('path');
var Async = require('async');
var Hapi = require('hapi');
var Utils = Hapi.utils;
var Boom = Hapi.boom;

function Assets(options) {

    this.config = options.config;
    this.models = options.models.models;
    this.storage = options.storage;
    this.api = options.api;
}

Assets.prototype._generateUniqueKey = function (file, done) {

    var Api = this.api;
    var Config = this.config;

    var self = this,
        retries = 10,
        filename,
        assetKey;

    filename = file.filename;

    file.increment = file.hasOwnProperty('increment') ? file.increment + 1 : 0;
    file.ext = file.ext || Path.extname(filename);
    file.basename = file.basename || Path.basename(filename, file.ext);
    file.createdAt = file.createdAt || new Date();

    assetKey = Config.keyForAsset(file);

    Api.Base.keyExists('Asset', assetKey, function (err, exists) {

        if (err) return done(err);

        if (exists && file.increment < retries) {

            // Try again...
            file.filename = file.basename + '-' + file.increment + file.ext;
            return self._generateUniqueKey(file, done);

        } else if (exists && file.increment >= retries) {

            // Retires exhausted
            return done(Boom.badRequest('Could not generate a unique asset key'));

        } else {

            file.key = assetKey;
            done();
        }
    });
};

Assets.prototype._generateKeys = function (files, done) {

    var self = this;

    Async.each(files, function (file, next) {

            self._generateUniqueKey(file, next);
        },
        function (err) {

            // Unique keys modify mutable file objs,
            // just need to know we're done.
            done(err);
        });
};

Assets.prototype._filesToAssets = function (items, assets, file, done) {

    var Models = this.models,
        Config = this.config,
        item = items.shift(),
        asset;

    // Merge file props onto
    // item properties (title, description).
    item = Utils.merge(item, file);

    // Create an asset url from the file obj
    item.url = Config.urlFor('asset', {
        asset: item
    }, true);

    // Finally, create an asset instance
    asset = new Models.Asset(item);

    asset.save(function (err, a) {
        if (err) return done(err);

        assets.push(a);
        done();
    });
};

Assets.prototype._filesToAssets = function (items, assets, files, done) {

    var self = this;

    Async.eachSeries(files, function (file, next) {

            // Handle each file in order, turning into assets
            self._fileToAsset(items, assets, file, next);

        },
        function (err) {

            done(err);
        });
};

Assets.prototype.list = function (args, done) {

    var Models = this.models,
        Api = this.api,
        query = args.query || {},
        list = {};

    var get = Api.Base.listParams(query);

    Models.Asset.all(get, function (err, assets) {

        if (err) return done(err);

        list = {
            type: 'assetList',
            sort: get.order.split(' ')[1].toLowerCase(),
            order: get.order.split(' ')[0],
            offset: get.skip,
            limit: get.limit,
            count: assets.length,
            items: assets
        };

        done(null, list);
    });
};

Assets.prototype.create = function (args, done) {

    var Models = this.models;
    var Api = this.api;
    var Storage = this.storage;
    var Config = this.config;

    var payload = args.payload;

    var self = this,
        multi = true,
        assets = [],
        files = [],
        items = [];

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

        return done(Boom.badRequest('No files uploaded'));
    }

    this._generateKeys(files, function (err) {

        if (err) return done(err);

        // Save our files, always returns an array.
        Storage.Local.save(files, function (err, files) {

            if (err) return done(Boom.badImplementation(err.message));

            self._filesToAssets(items, assets, files, function (err) {

                if (err) return done(err);

                // Queue everything up.
                Api.Base.enqueue(assets, 'asset.created', function (err) {

                    if (err) return done(err);

                    done(err, multi ? assets : assets[0]);
                });
            });
        });
    });
};

Assets.prototype.read = function (args, done) {

    var Models = this.models,
        Api = this.api;

    var get = Api.Base.readParams(args);

    if (!get) {

        return done(Boom.badRequest());
    }

    Models.Asset[get.method](get.params, function (err, asset) {
        if (err) {
            return done(err);
        }

        if (!asset) {
            return done(Boom.notFound());
        }

        done(err, asset);
    });
};

Assets.prototype.update = function (args, done) {

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
            return done(Boom.notFound());
        }

        if (payload.timestamp) {

            // Timestamp versioning in effect, compare
            if (asset.timestamp !== payload.timestamp) {
                return done(Boom.conflict());
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

                    done(err, asset ? asset : null);
                });

            } else {

                done(err, asset ? asset : null);
            }
        });
    });
};

Assets.prototype.destroy = function (args, done) {

    var Api = this.api;
    var Models = this.models;

    var query = args.query;
    var params = args.params;

    Models.Asset.find(params.id, function (err, asset) {
        if (err) {
            return done(err);
        }

        if (!asset) {
            return done(Boom.notFound());
        }

        if (query.destroy === 'true') {

            // A true destructive delete
            asset.destroy(function (err) {
                Api.Base.enqueue(asset, 'asset.destroyed', function (err) {
                    var results = {
                        message: 'Destroyed'
                    };
                    done(err, results);
                });
            });

        } else {

            // A more commons setting to make it unavailable
            asset.updateAttributes({
                deleted: true
            }, function (err) {
                Api.Base.enqueue(asset, 'asset.deleted', function (err) {
                    var results = {
                        message: 'Deleted'
                    };
                    done(err, results);
                });
            });
        }
    });
};

module.exports = function (root) {

    var assets = new Assets(root);
    return assets;
};

var Path = require('path');
var Async = require('async');
var Hapi = require('hapi');
var Utils = Hapi.utils;

function Assets(options) {

    this.config = options.config;
    this.models = options.models;
    this.storage = options.storage;
    this.api = options.api;
}

Assets.prototype._generateUniqueKey = function (file, done) {

    var self = this,
        Api = this.api,
        Config = this.config,
        retries = 10,
        assetKey,
        keyExt,
        keyBase;

    // File needs a time to generate a proper asset key
    file.createdAt = file.createdAt || new Date();

    // Parse, according to user tokens
    assetKey = Config.keyForAsset(file);

    // Break out pieces necessary for the key finder to increment
    keyExt = Path.extname(assetKey);
    keyBase = Path.join(Path.dirname(assetKey), Path.basename(assetKey, keyExt));

    Api.Base.findUniqueKey('Asset', keyBase, keyExt, null, function (err, key) {

        if (err) return done(err);

        file.filename = Path.basename(key);
        file.key = key;

        done();
    });
};

Assets.prototype._fileToAsset = function (file, options, done) {

    var Models = this.models,
        Config = this.config,
        item = options.item,
        implicit = options.implicit,
        asset = options.asset;

    if (asset) {

        // If there is an existing asset, just update it
        // with new file data
        asset.updateAttributes(file, function (err, asset) {
            done(err, asset);
        });

    } else {

        //* If no asset was provided, create a new one

        // Merge file props onto item properties
        item = Utils.merge(item || {}, file);

        // Create the new asset model
        asset = new Models.Asset(item);

        // Check for valid
        asset.isValid(function (valid) {

            // Ignore in implicit creation scenario
            if (!valid && implicit) return done();

            // Save and return newly created asset
            asset.save(function (err) {

                done(err, asset);
            });
        });
    }
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

/*
    Finishing a file creation involves generating or updating
    an asset, and determining whether the asset is ready to be
    queued.
*/
Assets.prototype._finalizeFile = function (file, options, done) {

    options = options || {};

    var Api = this.api;

    // Merges the file data with an asset
    this._fileToAsset(file, options, function (err, asset) {

        if (err) return done(err);

        // If storage is set, the asset is considered created
        // The creation event could be triggered even on asset file
        // replacement, the assumption being that a demon process
        // is going to need to do something similar in cases of either
        // replacement or initial creation.
        // TODO: consider a replacement flag and an `asset.updated` hook?
        if (asset.storage) {

            // Queue everything up.
            Api.Base.enqueue(asset, 'asset.created', function (err) {

                done(err, err ? null : asset);
            });

        } else {

            done(null, asset);
        }
    });
};

/*
    Stores an incoming file and returns an asset resource.
    Should eventually accept existing assets, and replace
    the files that lie behind resources...
*/
Assets.prototype.storeFile = function (args, done) {

    var self = this,
        Models = this.models,
        Storage = this.storage,
        headers = args.headers,
        params = args.params || {},
        fileStream = args.payload,
        finalizeOptions;

    if (!fileStream) {

        return done(Hapi.error.badRequest('No file present'));
    }

    var fileData = {
        filename: headers['x-file-name'],
        bytes: headers['x-file-size'],
        mimetype: headers['content-type'],
        createdAt: new Date(),
    };

    if (params.id) {

        // Updating an existing asset, get the key and filename
        Models.Asset.find(params.id, function (err, asset) {

            fileData.key = asset.key;
            fileData.filename = asset.filename;

            Storage.save(fileStream, fileData, function (err, fileData) {

                if (err) return done(err);

                finalizeOptions = {
                    asset: asset
                };

                self._finalizeFile(fileData, finalizeOptions, done);
            });
        });

    } else {

        this._generateUniqueKey(fileData, function (err) {

            Storage.save(fileStream, fileData, function (err, fileData) {

                if (err) return done(err);

                self._finalizeFile(fileData, finalizeOptions, done);
            });
        });
    }
};

/*
    Create can just create an asset object (provisioning scenario)
    or it can handle a multipart file upload to do everything at once.
*/
Assets.prototype.create = function (args, done) {

    var self = this,
        Storage = this.storage,
        payload = args.payload || {},
        query = args.query || {},
        implicit = (query.implicit === true),
        file = payload.file,
        store;

    if (file) {

        item = payload;
        delete item.file;

        if (file.path) {
            store = true;
        }

    } else {

        return done(Hapi.error.badRequest('No file uploaded'));
    }

    var options = {
        item: item,
        implicit: implicit
    };

    this._generateUniqueKey(file, function (err) {

        if (err) return done(err);

        if (store) {

            // Save our files
            Storage.save(file, function (err, file) {

                // Always returns an array.
                self._finalizeFile(file, options, done);
            });

        } else {

            // Just creating an asset object, but the file isn't
            // yet ready, so don't queue it.
            self._finalizeFile(file, options, done);
        }
    });
};

Assets.prototype.read = function (args, done) {

    var Models = this.models,
        Api = this.api;

    var get = Api.Base.readParams(args);

    if (!get) {

        return done(Hapi.error.badRequest());
    }

    Models.Asset[get.method](get.params, function (err, asset) {

        if (err) return done(err);

        if (!asset) {
            return done(Hapi.error.notFound());
        }

        Api.Base.loadRelations(asset, function (err) {
            done(err, asset);
        });
    });
};

Assets.prototype.update = function (args, done) {

    var Models = this.models,
        Api = this.api,
        query = args.query,
        params = args.params,
        payload = args.payload,
        clearQueue = false,
        jobId;

    if (query.clearQueue) {
        clearQueue = true;
        jobId = parseInt(query.clearQueue, 10);
    }

    this.read(args, function (err, asset) {
        if (err) return done(err);
        if (!asset) return done(Hapi.error.notFound());

        // Simple version control
        if (query.version && asset._version_ !== query.version) {

            // Return conflict if version (timestamp) doesn't match
            return done(Hapi.error.conflict());
        }

        if (clearQueue) {

            // Pass in the private queue clearing flag
            asset.__data.clearQueue = jobId;
        }

        asset.updateAttributes(payload, function (err, asset) {

            if (!clearQueue) {

                Api.Base.processRelations(asset, payload, function (err) {
                    Api.Base.enqueue(asset, 'asset.updated', function (err) {
                        done(err, !err ? asset : null);
                    });
                });

            } else {

                done(err, !err ? asset : null);
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
            return done(Hapi.error.notFound());
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

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

        file.key = key;
        done();
    });
};

// Assets.prototype._generateKeys = function (files, done) {

//     var self = this;

//     Async.eachSeries(files, function (file, next) {

//             self._generateUniqueKey(file, next);
//         },
//         function (err) {

//             // Unique keys modify mutable file objs,
//             // just need to know we're done.
//             done(err);
//         });
// };

Assets.prototype._fileToAsset = function (file, options, done) {

    var Models = this.models,
        Config = this.config,
        item = options.item || {},
        implicit = options.implicit,
        asset = options.asset;

    // Merge file props onto
    // item properties (title, description).
    item = Utils.merge(item, file);

    if (asset) {

        asset.storage = file.storage;
        asset.data = file.data;
        asset.mimetype = file.mimetype;

    } else {

        asset = new Models.Asset(item);
    }

    // Create an asset url from the file obj
    if (asset.storage) {

        asset.url = Config.urlFor('asset', {
            asset: asset
        }, true);
    }

    asset.isValid(function (valid) {

        if (!valid && implicit) return done();

        asset.save(function (err) {

            done(err, asset);
        });
    });
};

// Assets.prototype._filesToAssets = function (files, options, done) {

//     var self = this;

//     Async.eachSeries(files, function (file, next) {

//             // Handle each file in order, turning into assets
//             self._fileToAsset(file, options, next);

//         },
//         function (err) {

//             done(err);
//         });
// };

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

Assets.prototype._finalizeFile = function (file, options, done) {

    options = options || {};

    var Api = this.api;

    this._fileToAsset(file, options, function (err, asset) {

        if (err) return done(err);

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
    Storing a file requires an existing asset, which provides
    a key for storage. If the storage completes this method
    returns the updated, complete asset and triggers the `asset.created`
    task.
*/
Assets.prototype.storeFile = function (args, done) {

    var self = this,
        Models = this.models,
        Storage = this.storage,
        headers = args.headers,
        params = args.params || {},
        fileStream = args.payload;

    if (!fileStream) {

        return done(Boom.badRequest('No asset id provided or no file present'));
    }

    var file = {
        filename: headers['x-file-name'],
        bytes: headers['x-file-size'],
        createdAt: new Date(),
    };

    this._generateUniqueKey(file, function (err) {

        Storage.Local.save(fileStream, file, function (err, file) {

            if (err) return done(err);

            self._finalizeFile(file, null, done);
        });
    });
};

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

        return done(Boom.badRequest('No file uploaded'));
    }

    var options = {
        item: item,
        implicit: implicit
    };

    this._generateUniqueKey(file, function (err) {

        if (err) return done(err);

        if (store) {

            // Save our files
            Storage.S3.save(file, function (err, file) {

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

// Assets.prototype.create = function (args, done) {

//     var Models = this.models,
//         Api = this.api,
//         Storage = this.storage,
//         Config = this.config,
//         payload = args.payload || {},
//         query = args.query || {},
//         implicit = (query.implicit === true);

//     var self = this,
//         multi = true,
//         assets = [],
//         files = [],
//         items = [];

//     // TODO: Only supporting one at a time right now!
//     //
//     // Can create 1 or many assets at once.
//     // if (payload.items) {

//     //     payload.items.forEach(function (item) {

//     //         files.push(item.file);
//     //         delete item.file;

//     //         items.push(item);
//     //     });

//     // } else if (payload.file) {
//     console.log(payload);
//     if (payload.file) {
//         // Can't have that in there...
//         files.push(payload.file);
//         delete payload.file;

//         items.push(payload);
//         multi = false;

//     } else {

//         return done(Boom.badRequest('No files uploaded'));
//     }

//     this._generateKeys(files, function (err) {

//         if (err) return done(err);

//         // Save our files, always returns an array.
//         Storage.Local.save(files, function (err, files) {

//             if (err) return done(Boom.badImplementation(err.message));

//             var options = {
//                 assets: assets,
//                 items: items,
//                 implicit: implicit
//             };

//             self._filesToAssets(files, options, function (err) {

//                 if (err) return done(err);

//                 // Queue everything up.
//                 Api.Base.enqueue(assets, 'asset.created', function (err) {

//                     if (err) return done(err);

//                     done(err, multi ? assets : assets[0]);
//                 });
//             });
//         });
//     });
// };

Assets.prototype.read = function (args, done) {

    var Models = this.models,
        Api = this.api;

    var get = Api.Base.readParams(args);

    if (!get) {

        return done(Boom.badRequest());
    }

    Models.Asset[get.method](get.params, function (err, asset) {

        if (err) return done(err);

        if (!asset) {
            return done(Boom.notFound());
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
        if (!asset) return done(Boom.notFound());

        // Simple version control
        if (query.version && asset._version_ !== query.version) {

            // Return conflict if version (timestamp) doesn't match
            return done(Boom.conflict());
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

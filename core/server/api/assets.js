var Path = require('path'),
    Hapi = require('hapi'),
    Hoek = require('hoek'),
    Helpers = require('../helpers').api;

function Assets(options) {

    this.config = options.config;
    this.models = options.models;
    this.storage = options.storage;
    this.api = options.api;
    this.check = options.snack.permissions.check;
}

Assets.prototype.list = function (options, context, done) {

    var Asset = this.models.Asset;

    if (!context.user) {
        options.where = options.where || {};
        options.where._deleted_ = false;
    }

    Asset
        .find(options)
        .then(function (assetList) {

            done(null, assetList);
        })
        .caught(function (err) {

            done(err);
        });
};

Assets.prototype.read = function (options, context, done) {

    var Asset = this.models.Asset;

    if (!context.user) {
        options.where = options.where || {};
        options.where._deleted_ = false;
    }

    Asset
        .findOne(options)
        .then(function (asset) {

            if (!asset) {
                throw Hapi.error.notFound();
            }

            done(null, asset);
        })
        .caught(function (err) {

            done(err);
        });
};

Assets.prototype.create = function (options, context, done) {

    var Asset = this.models.Asset,
        Check = this.check;

    var data = options.payload,
        user = context.user;

    if (!data) {
        return done(Hapi.error.badRequest());
    }

    Check(user)
        .create
        .asset()
        .bind({})
        .then(function (allowed) {

            if (!allowed) {
                throw Hapi.error.unauthorized();
            }

            if (!data.ownedBy) {
                data.ownedBy = user;
            }

            return Asset.create(data);
        })
        .then(function (asset) {

            this.asset = asset;

            return asset.enqueue('created');
        })
        .then(function (job) {

            this.job = job;

            this.asset._queue_.unshift({
                id: job.id,
                path: job.path
            });

            this.asset.save();
        })
        .then(function (asset) {

            if (this.job) {
                this.job.start();
            }

            done(null, this.asset);
        })
        .caught(function (err) {

            done(err);
        });
};

Assets.prototype.edit = function (options, context, done) {

    var Asset = this.models.Asset,
        Check = this.check;

    var payload = options.payload,
        user = context.user;

    Check(user)
        .edit
        .asset(options.where)
        .then(function () {

            return Asset.update(payload, options);
        })
        .then(function (asset) {

            if (!options.clearQueue) {
                return asset.enqueue('edited');
            }

            return asset;
        })
        .then(function (asset) {

            done(null, asset);
        })
        .caught(function (err) {

            done(err);
        });
};

Assets.prototype.remove = function (options, context, done) {

    var Asset = this.models.Asset,
        Check = this.check;

    var user = context.user;

    Check(user)
        .remove
        .asset(options.where)
        .then(function (allowed) {

            if (!allowed) {
                throw Hapi.error.unauthorized();
            }

            if (options.destroy) {
                return Asset.destroy(options);
            } else {
                return Asset.update({
                    _deleted_: true
                }, options);
            }

        })
        .then(function (asset) {

            return asset.enqueue(options.destroy ? 'destroyed' :  'deleted');
        })
        .then(function (tag) {

            done(null, options.destroy ? 'destroyed' :  'deleted');
        })
        .caught(function (err) {

            done(err);
        });
};

module.exports = function (root) {

    return new Assets(root);
};

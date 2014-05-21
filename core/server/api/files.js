var Path = require('path'),
    Hapi = require('hapi'),
    Hoek = require('hoek'),
    Promise = require('bluebird'),
    Helpers = require('../helpers').api;

function Files(options) {

    this.models = options.models;
    this.config = options.config;
    this.api = options.api;
    this.check = options.snack.permissions.check;
    this.storage = options.storage;
}

/*
    Stores an incoming file and returns an asset resource.
    Should eventually accept existing assets, and replace
    the files that lie behind resources...
*/
Files.prototype.store = function (options, context, done) {

    var Models = this.models,
        Alias = Models.Alias,
        Asset = Models.Asset,
        Storage = this.storage,
        Api = this.api,
        Check = this.check,
        fileData = options.file,
        fileStream = options.payload,
        user = context.user;

    if (!fileStream) {
        return done(Hapi.error.badRequest('No file present'));
    }

    Check(user)
        .create
        .asset()
        .bind({})
        .then(function (allowed) {

            if (!allowed) {
                throw Hapi.error.unauthorized();
            }

            var fileAlias = Helpers.aliasForFile(fileData);
            return Alias.createUnique(fileAlias);
        })
        .then(function (alias) {

            this.alias = alias;

            fileData.key = Helpers.aliasToKey(alias.key, 'asset');
            fileData.filename = Path.basename(fileData.key);

            return Storage.save(fileStream, fileData);
        })
        .then(function (fileData) {

            var payload = Hoek.merge(fileData, {
                aliases: [this.alias]
            });

            var options = {
                payload: payload
            };

            return Api.assets
                .create(options, context, function (err, asset) {
                    if (err) throw err;
                    done(null, asset);
                });
        })
        .catch(function (err) {
            done(err);
        });
};

module.exports = function (root) {

    return new Files(root);
};

var Async = require('async');
var Hapi = require('hapi');
var Utils = Hapi.utils;

var internals = {};

function Users(options) {

    this.server = options.server;
    this.models = options.models;
    this.config = options.config;
    this.api = options.api;
    this.hooks = options.config().hooks;
}

Users.prototype.list = function (args, done) {

    var Models = this.models,
        Api = this.api,
        query = args.query,
        options = query,
        list;

    options.modelName = 'User';
    var get = Api.base.listParams(options);
    var where = Utils.clone(get.where);

    Models.User.all(get, function (err, users) {

        if (err) return done(err);

        Models.User.count(where, function (err, count) {

            if (err) return done(err);

            list = {
                type: 'userList',
                sort: get.order.split(' ')[1].toLowerCase(),
                order: get.order.split(' ')[0],
                offset: get.skip,
                limit: get.limit,
                total: count,
                count: users.length,
                items: users
            };

            done(null, list);
        });
    });
};

Users.prototype.create = function (args, done) {

    var Models = this.models,
        Api = this.api,
        payload = args.payload;

    var user = new Models.User(payload);

    user.save(function (err) {

        if (err) return done(err);

        Api.base.processRelations(user, null, function (err) {

            Api.base.enqueue(user, 'user.created', function (err) {

                done(err, user);
            });
        });
    });
};

Users.prototype.read = function (args, done) {

    var Models = this.models,
        Api = this.api;

    var get = Api.base.readParams(args);

    if (!get) {

        return done(Hapi.error.badRequest());
    }

    Models.User[get.method](get.params, function (err, user) {

        if (err) return done(Hapi.error.badImplementation(err.message));
        if (!user) return done(Hapi.error.notFound());

        Api.base.loadRelations(user, get.relations, function (err) {
            done(err, err ? null : user);
        });
    });
};

Users.prototype.edit = function (args, done) {

    var Models = this.models,
        Api = this.api,
        query = args.query,
        version = query.version,
        params = args.params,
        payload = args.payload,
        clearQueue = false,
        jobId;

    if (query.clearQueue) {
        clearQueue = true;
        jobId = parseInt(query.clearQueue, 10);
    }

    Models.User.find(params.id, function (err, user) {

        if (err) return done(err);

        if (!user) {
            return done(Hapi.error.notFound());
        }

        // Simple version control
        if (version && user._version_ !== version) {

            // Return conflict if version (timestamp) doesn't match
            return done(Hapi.error.conflict());
        }

        if (clearQueue) {

            // Pass in the private queue clearing flag
            user.__data.clearQueue = jobId;
        }

        user.updateAttributes(payload, function (err, user) {

            if (!clearQueue) {

                Api.base.processRelations(user, payload, function (err) {

                    Api.base.enqueue(user, 'user.updated', function (err) {
                        done(err, !err ? user : null);
                    });
                });

            } else {

                done(err, !err ? user : null);
            }
        });
    });
};

Users.prototype.remove = function (args, done) {

    var Models = this.models,
        Api = this.api,
        query = args.query,
        params = args.params;

    Models.User.find(params.id, function (err, user) {

        if (err) return done(err);

        if (!user) {
            return done(Hapi.error.notFound());
        }

        // A true destructive delete
        user.destroy(function (err) {
            Api.base.enqueue(user, 'user.destroyed', function (err) {
                var results = {
                    message: 'Destroyed'
                };
                done(err, results);
            });
        });
    });
};

module.exports = function (root) {

    return new Users(root);
};

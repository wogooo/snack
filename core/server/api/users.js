var Hapi = require('hapi'),
    Hoek = require('hoek'),
    Helpers = require('../helpers').api;

var internals = {};

function Users(options) {

    this.server = options.server;
    this.models = options.models;
    this.config = options.config;
    this.check = options.snack.permissions.check;
}

Users.prototype.list = function (options, context, done) {

    var Models = this.models,
        User = Models.User;

    User.find(options)
        .then(function (userList) {

            done(null, userList);
        })
        .caught(function (err) {

            done(err);
        });
};

Users.prototype.read = function (options, context, done) {

    var Models = this.models,
        User = Models.User;

    User.findOne(options)
        .then(function (user) {

            if (!user) {
                throw Hapi.error.notFound();
            }

            done(null, user);
        })
        .caught(function (err) {

            done(err);
        });
};

Users.prototype.create = function (options, context, done) {

    var Models = this.models,
        User = Models.User,
        Check = this.check;

    var data = options.payload,
        user = context.user;

    if (!data) {
        return done(Hapi.error.badRequest());
    }

    Check(user)
        .create
        .user()
        .then(function (allowed) {

            if (!allowed) {
                throw Hapi.error.unauthorized();
            }

            return User.create(data, { upsert: true });
        })
        .then(function (user) {

            return user.enqueue('created');
        })
        .then(function (user) {

            done(null, user);
        })
        .caught(function (err) {

            done(err);
        });
};

Users.prototype.edit = function (options, context, done) {

    var Models = this.models,
        User = Models.User,
        Check = this.check;

    var data = options.payload,
        user = context.user;

    Check(user)
        .edit
        .user(options.where)
        .then(function () {

            return User.update(data, options);
        })
        .then(function (user) {

            if (!options.clearQueue) {
                return user.enqueue('edited');
            }

            return user;
        })
        .then(function (user) {

            done(null, user);
        })
        .caught(function (err) {

            done(err);
        });

};

Users.prototype.remove = function (options, context, done) {

    var Models = this.models,
        User = Models.User,
        Check = this.check;

    var user = context.user;

    // Users are always destroyed.
    Check(user)
        .remove
        .user(options.where)
        .then(function (allowed) {

            if (!allowed) {
                throw Hapi.error.unauthorized();
            }

            return User.destroy(options);
        })
        .then(function (user) {

            return user.enqueue('destroyed');
        })
        .then(function (user) {

            done(null, 'destroyed');
        })
        .caught(function (err) {

            done(err);
        });
};

module.exports = function (root) {

    return new Users(root);
};

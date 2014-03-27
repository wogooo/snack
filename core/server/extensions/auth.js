var LocalStrategy = require('passport-local').Strategy;
var Bcrypt = require('bcrypt');
var Hapi = require('hapi');
var Utils = Hapi.utils;

var internals = {};

internals.Auth = function (options) {

    this.models = options.models;
    this.passport = options.passport;

    this._settings = {
        strategy: 'local',
        authenticate: {
            successRedirect: '/snack',
            failureRedirect: '/snack/login',
            failureFlash: true
        }
    };

    this._setup();
};

internals.Auth.prototype._setup = function () {

    var self = this,
        Passport = this.passport,
        invalid = {};

    invalid.message = 'Invalid credentials';

    Passport.use(new LocalStrategy(function (username, password, done) {

        if (username && password) {

            self.verifyUser(username, password, function (err, user) {

                if (err) return done(err);

                if (!user) {
                    return done(null, false, invalid);
                }

                done(null, user);
            });

        } else {

            done(null, false, invalid);
        }
    }));

    Passport.serializeUser(function (user, done) {

        done(null, user.id);
    });

    Passport.deserializeUser(function (id, done) {

        self._getUser(id, done);
    });
};

internals.Auth.prototype._getUser = function (id, done) {

    var Models = this.models;
    Models.User.find(id, function (err, user) {

        done(err, user ? user.toJSON() : null);
    });
};

internals.Auth.prototype._findUser = function (emailOrUsername, done) {

    var Models = this.models,
        params = {
            where: {}
        },
        key;

    if (emailOrUsername.search(/@/) > -1) {
        key = 'email';
    } else {
        key = 'username';
    }

    params.where[key] = emailOrUsername;

    Models.User.findOne(params, done);
};

internals.Auth.prototype.verifyUser = function (usernameOrEmail, password, done) {

    this._findUser(usernameOrEmail, function (err, user) {

        if (err) return done(err);
        if (!user) return done(null, null);

        Bcrypt.compare(password, user.password, function (err, match) {
            done(err, match ? user : null);
        });
    });
};

internals.Auth.prototype.authenticate = function (request, reply) {

    var Passport = this.passport,
        settings = this._settings;

    Passport.authenticate(settings.strategy, settings.authenticate)(request, reply);
};

internals.register = function (extensions, next) {

    var Server = extensions.server,
        Snack = Server.app,
        Models = Snack.models;

    var authOptions = {
        models: Models,
        passport: Server.plugins.travelogue.passport
    };

    Server.auth.strategy('passport', 'passport');

    var auth = new internals.Auth(authOptions);
    extensions.expose('auth', auth);

    next();
};

exports.register = internals.register;

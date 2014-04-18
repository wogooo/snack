var LocalStrategy = require('passport-local').Strategy;
var Bcrypt = require('bcrypt');
var Hapi = require('hapi');
var Utils = require('hoek');

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

        // Only store the id, but in obj form so upgrades
        // to request.user don't break functionality.
        done(null, { id: user.id });
    });

    Passport.deserializeUser(function (user, done) {

        // Just passing the id back into the user object
        // to avoid unnecessary DB hits. When the user
        // is needed it can be loaded from request.user.
        done(null, user);
    });
};

internals.Auth.prototype.upgradeUser = function (request/*, reset, done*/) {

    var reset = (arguments.length === 3 ? arguments[1] : null);
    var done = (arguments.length === 3 ? arguments[2] : arguments[1]);

    var user = request.session.user || request.user;

    if (!user || !(user instanceof Object) || !user.id) {

        // Without a user / id this user must not be logged in
        return done(Hapi.error.unauthorized('Not logged in.'));
    }

    if (user.username && !reset) {

        // Assume already upgraded if a username is set
        return done(null, user);
    }

    var Models = this.models;

    Models.User.find(user.id, function (err, user) {
        if (err || !user) return done(Hapi.error.badImplementation('Find user error.'));

        // Don't pass around this big vivified user
        user = user.toJSON();

        // Store in the session so this doesn't happen over and over
        request.session.user = user;

        // Return the user
        done(null, user);
    });
};

internals.Auth.prototype._findUser = function (emailOrUsername, done) {

    var Models = this.models;

    Models.User.check(emailOrUsername, done);
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

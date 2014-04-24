var LocalStrategy = require('passport-local').Strategy;
var Jwt = require('jsonwebtoken');
var Bcrypt = require('bcrypt');
var Hapi = require('hapi');

var internals = {};

internals.Auth = function (options) {

    this.models = options.models;
    this.passport = options.passport;
    this.secret = options.secret;

    this._settings = {};

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
        done(null, {
            id: user.id
        });
    });

    Passport.deserializeUser(function (user, done) {

        // Just passing the id back into the user object
        // to avoid unnecessary DB hits. When the user
        // is needed it can be loaded from request.user.
        done(null, user);
    });
};

internals.Auth.prototype.upgradeUser = function (request /*, reset, done*/ ) {

    var reset = (arguments.length === 3 ? arguments[1] : null);
    var done = (arguments.length === 3 ? arguments[2] : arguments[1]);

    var user;

    if (request.session && request.session.user) {
        user = request.session.user;
    } else {
        user = request.user;
    }

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
        if (request.session) {
            request.session.user = user;
        }

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

    var Passport = this.passport;

    Passport.authenticate('local', { failureFlash: true })(request, reply);
};

internals.Auth.prototype.validateBasic = function (username, password, done) {

    var self = this,
        invalid = {};

    invalid.message = 'Invalid credentials';

    if (username && password) {

        this.verifyUser(username, password, function (err, user) {

            if (err) return done(err);

            if (!user) {
                return done(null, false, invalid);
            }

            done(null, true, user.toJSON());
        });

    } else {

        done(null, false, invalid);
    }
};

internals.Auth.prototype.getToken = function (user) {

    var secret = this.secret;

    var credentials = {
        id: user.id
    };

    var accessToken = Jwt.sign(credentials, secret);

    var token = {
        token_type: 'bearer',
        access_token: accessToken
    };

    return token;
};

internals.Auth.prototype.validateToken = function (decodedToken, done) {

    if (!decodedToken) return done(null, false);

    var pseudoRequest = {
        user: decodedToken
    };

    // TODO: Temporary

    this.upgradeUser(pseudoRequest, function (err, user) {

        if (err) return done(err);
        if (!user) return done(null, false);

        return done(null, true, user);
    });
};

internals.register = function (extensions, next) {

    var Server = extensions.server,
        Snack = Server.app,
        Models = Snack.models,
        Config = Snack.config,
        secret = Config().secret;

    var authOptions = {
        secret: secret,
        models: Models,
        passport: Server.plugins.travelogue.passport
    };

    var auth = new internals.Auth(authOptions);

    Server.auth.strategy('passport', 'passport');

    Server.auth.strategy('basic', 'basic', {
        validateFunc: function (username, password, cb) {
            auth.validateBasic(username, password, cb);
        }
    });

    Server.auth.strategy('token', 'jwt', {
        key: secret,
        validateFunc: function (decodedToken, cb) {
            auth.validateToken(decodedToken, cb);
        }
    });

    extensions.expose('auth', auth);

    next();
};

exports.register = internals.register;

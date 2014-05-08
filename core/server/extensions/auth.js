var LocalStrategy = require('passport-local').Strategy,
    Jwt = require('jsonwebtoken'),
    Bcrypt = require('bcrypt'),
    Hapi = require('hapi');

var internals = {};

internals.Auth = function (options) {

    this.models = options.models;
    this.passport = options.passport;
    this.secret = options.secret;

    this._settings = {};
    this._settings.urls = options.urls;

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

internals.Auth.prototype.authenticate = function (request, reply, options) {

    var options = options || {},
        Passport = this.passport;

    Passport.authenticate('local', options)(request, reply);
};

/*
    Basic auth can only be reliable if used over a secure connection.
    TODO: Consider an implementation of public key + private key signing
          of a packet, with a resulting comparison to db-stored private key
          decrypt, to determine whether the user can get a token. Sort of like
          AWS, but only for the intial auth.
*/

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

/*
    A token will be jwt signed with our server secret.
*/
internals.Auth.prototype.getToken = function (user) {

    var secret = this.secret,
        // 1 day
        expires = 86400;

    var tokenOptions = {
        expiresInMinutes: expires / 60
    };

    var credentials = {
        client_id: user.username
    };

    var accessToken = Jwt.sign(credentials, secret, tokenOptions);

    var token = {
        token_type: 'Bearer',
        access_token: accessToken,
        expires_in: expires
    };

    return token;
};

/*
    Test for a valid token by ensuring it was cryptographically signed
    with our secret, and contains a valid user object as the payload.
    Load that user so we're able to determine any permissions.
*/
internals.Auth.prototype.validateToken = function (decodedToken, done) {

    if (!decodedToken || !decodedToken.client_id) return done(null, false);

    // TODO: Temporary

    this._findUser(decodedToken.client_id, function (err, user) {

        if (err) return done(err);
        if (!user) return done(null, false);

        return done(null, true, user.toJSON());
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

    Server.auth.strategy('passport', 'passport', {
        apiMode: false
    });

    Server.auth.strategy('passport-api', 'passport', {
        apiMode: true
    });

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

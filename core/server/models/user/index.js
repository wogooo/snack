var Helpers = require('../../helpers').models,
    Definition = require('./definition'),
    Base = require('../base');

var internals = {};

internals._effectivePermissions = function (user) {

    user = user || {};

    var all = [],
        effective = [],
        seen = {},
        role,
        perm,
        permKey;

    all = all.concat(user.permissions || []);

    if (user.roles) {
        for (var r in user.roles) {
            role = user.roles[r];
            all = all.concat(role.permissions || []);
        }
    }

    for (var a in all) {

        perm = all[a];
        permKey = perm.action + '.' + perm.actionFor + '.' + perm.actionForId;

        if (!seen[permKey]) {
            effective.push(perm);
            seen[permKey] = true;
        }
    }

    return effective;
};

internals.relations = function (models, next) {

    var Models = models.models,
        Model = Models[Definition.name];

    Helpers.registerRelations(Models, Definition);

    Model.once('ready', function () {
        next();
    });
};

internals.register = function (models, next) {

    var pack = models.pack,
        snack = pack.app,
        enqueue = models.enqueue,
        thinky = snack.services.thinky;

    var User = Helpers.createModel(thinky, Definition, Base);

    User.docAddListener('saving', function (doc) {

        var was = doc.getOldValue();

        // Version and updated timestamp
        var now = Date.now();
        doc._version_ = now;
        doc.updatedAt = new Date(now);
    });

    User.define('enqueue', function (event) {

        return enqueue.add(this, event);
    });

    User.define('setPassword', function (password) {

        this.password = Helpers.generateSecureHash(password);
    });

    User.define('validPassword', function (password) {

        return Helpers.compareSecureHash(password, this.password);
    });

    User.check = function (emailOrUsername, password) {

        var key,
            params = {
                where: {}
            };

        if (emailOrUsername.search(/@/) > -1) {
            key = 'email';
        } else {
            key = 'username';
        }

        params.where[key] = emailOrUsername;

        var findUser = this.findOne(params);

        return findUser
            .then(function (user) {
                if (user && user.validPassword(password)) {
                    return user;
                }
            });
    };

    User.effectivePermissions = function (doc) {

        var effectivePermissions = internals._effectivePermissions;

        var options = {
            where: {
                id: doc.id
            },
            include: {
                roles: {
                    permissions: true
                },
                permissions: true
            }
        };

        return User
            .findOne(options)
            .then(function (user) {

                return effectivePermissions(user);
            });
    };

    models.after(internals.relations);

    User.once('ready', function (model) {

        models.expose(model);
        next();
    });
};

exports.register = internals.register;

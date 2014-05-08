var Hapi = require('hapi');
    Capitalize = require('inflection').capitalize,
    Promise = require('bluebird');

var internals = {};

internals.CheckResult = function (options) {

    this.models = options.models;
    this.actions = options.actions;
    this.user = options.user;

    this._init();
};

internals.CheckResult.prototype._buildActionForHandlers = function (actionForTypes, action) {

    var self = this,
        Models = this.models,
        handlers = {};

    var handler = function (actionFor) {

        var TargetModel = Models[Capitalize(actionFor)];

        return function (modelOrId) {

            return new Promise(function (resolve, reject) {

                if (!self.user) {
                    throw Hapi.error.unauthorized();
                }

                var userId = self.user.id;
                var modelId = null;

                if (modelOrId instanceof Object) {
                    modelId = modelOrId.id;
                } else if (modelOrId) {
                    modelId = modelOrId;
                }

                Models.User.effectivePermissions(userId, function (err, userPermissions) {

                    if (err) return reject(err);

                    // Allow for a target model to implement a "Permissable" interface
                    // if (TargetModel && (TargetModel.permissable instanceof Function)) {

                    //     var permissable = {
                    //         modelId: modelId,
                    //         action: action,
                    //         userId: userId,
                    //         userPermissions: userPermissions
                    //     };

                    //     return TargetModel.permissable(permissable, done);
                    // }

                    var perm;
                    for (var i in userPermissions) {
                        perm = userPermissions[i];
                        if (perm.action === action && perm.actionFor === actionFor) {

                            return resolve(null, true);
                        }
                    }

                    resolve(null, false);
                });
            });
        };
    };

    actionForTypes.forEach(function (actionFor) {
        handlers[actionFor] = handler(actionFor);
    });

    return handlers;
};

internals.CheckResult.prototype._init = function () {

    var actions = this.actions,
        actionForTypes,
        actionForHandlers;

    for (var action in actions) {

        actionForTypes = actions[action];

        actionForHandlers = this._buildActionForHandlers(actionForTypes, action);

        Object.defineProperty(this, action, {
            writable: false,
            enumerable: false,
            configurable: false,
            value: actionForHandlers
        });
    }
};

internals.Permissions = function (options) {

    this._models = options.models;
    this._actions = {};

    this._checkResult = {};
};

internals.Permissions.prototype.check = function (user) {

    var checkResult = new internals.CheckResult({
        models: this._models,
        actions: this._actions,
        user: user
    });

    return checkResult;
};

internals.Permissions.prototype.init = function (done) {

    var self = this,
        Models = this._models,
        actions = {},
        seen = {};

    Models.Permission.all(function (err, permissions) {

        if (err) return done(err);

        permissions.forEach(function (perm) {

            actions[perm.action] = actions[perm.action] || [];
            seen[perm.action] = seen[perm.action] || {};

            if (seen[perm.action][perm.actionFor]) {
                return;
            }

            actions[perm.action].push(perm.actionFor);
            seen[perm.action][perm.actionFor] = true;
        });

        self._actions = actions;

        done();
    });
};

internals.init = function (server, next) {

    var Snack = server.app;

    var permissions = new internals.Permissions({
        models: Snack.models
    });

    permissions.init(function (err) {

        Snack.permissions = {};

        Snack.permissions.check = function (user) {
            return permissions.check(user);
        };

        Snack.permissions.refresh = function (done) {
            return permissions.init(done);
        };

        next(err);
    });

    server.pack.events.on('permissions.refresh', function () {

        permissions.init(function (err) {

            // If the permissions couldn't be refreshed,
            // will need a server restart.
            if (err) {
                Snack.errorHandling.restartServer(server);
            }

            server.log(['info', 'permissions'], 'Permissions refreshed');
        });
    });
};

exports.init = internals.init;

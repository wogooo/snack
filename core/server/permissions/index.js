var Hapi = require('hapi'),
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
        User = Models.User,
        handlers = {};

    var handler = function (actionFor) {

        var TargetModel = Models[Capitalize(actionFor)];

        return function (modelOrId) {

                var user = self.user;

                if (!user) {
                    throw Hapi.error.unauthorized();
                }

                var modelId = null;

                if (modelOrId instanceof Object) {
                    modelId = modelOrId.id;
                } else if (modelOrId) {
                    modelId = modelOrId;
                }

                return User
                    .effectivePermissions(user)
                    .then(function (permissions) {

                        // Allow for a target model to implement a "Permissable" interface
                        if (TargetModel && (TargetModel.permissable instanceof Function)) {

                            var permissable = {
                                actionForId: modelId,
                                action: action,
                                user: user,
                                userPermissions: permissions
                            };

                            return TargetModel.permissable(permissable);
                        }

                        var perm, p;

                        for (p in permissions) {
                            perm = permissions[p];
                            if (perm.action === action && perm.actionFor === actionFor) {

                                if (perm.actionForId && perm.actionForId !== modelId) {
                                    return false;
                                }

                                return true;
                            }
                        }
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
        Permission = this._models.Permission,
        actions = {},
        seen = {};

    Permission
        .find()
        .then(function (permissions) {

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
        })
        .caught(function (err) {

            done(err);
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

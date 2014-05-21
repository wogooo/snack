var Helpers = require('../../helpers').models,
    Slug = Helpers.generateSlug,
    Hash = Helpers.generateUrlHash,
    RandomPassword = Helpers.generateRandomPassword;

module.exports = {

    name: 'User',

    schema: {
        email: String,
        username: {
            _type: String,
            default: function () {
                if (this.email) {
                    return Slug(this.email.replace(/@.+$/, ''));
                }
            }
        },
        password: {
            _type: String,
            default: function () {
                if (!this.password) {
                    return RandomPassword();
                }
            }
        },
        id: {
            _type: String,
            default: function () {
                if (this.username || this.email) {
                    var uniqueName = this.username || this.email;
                    return Hash(uniqueName);
                }
            }
        },
        type: {
            _type: String,
            default: 'user'
        },
        kind: {
            _type: String,
            default: 'user'
        },
        displayName: {
            _type: String,
            default: function () {
                return this.username || this.email;
            }
        },
        // 'active', 'disabled', locked', 'pending'
        status: {
            _type: String,
            default: 'pending'
        },
        createdAt: {
            _type: Date,
            default: new Date()
        },
        updatedAt: {
            _type: Date,
            default: new Date()
        },
        _api_: {
            _type: Boolean,
            default: function () {
                return (this.kind === 'api');
            }
        },
        _version_: {
            _type: Number,
            default: Date.now()
        },
        _queue_: {
            _type: Array,
            default: []
        }
    },

    options: {
        enforce_missing: true,
        validate: 'oncreate',
        validator: function () {

            if (this.email && this.email.search(/.+@.+\..+/i) < 0) {

                // Simple check for valid email.
                return false;
            }

            if (this.username && this.username.search(/@/) > -1) {

                // Usernames are NOT emails.
                return false;
            }

            return true;
        }
    },

    indexes: {
        'createdAt': true,
        'username': true,
        'email': true,
        'kind': true,
        'status': true
    },

    relations: {
        'stories': {
            model: 'Story',
            type: 'hasMany',
            leftKey: 'username',
            rightKey: 'owner'
        },
        'assets': {
            model: 'Asset',
            type: 'hasMany',
            leftKey: 'username',
            rightKey: 'owner'
        },
        'roles': {
            model: 'Role',
            type: 'hasAndBelongsToMany',
            leftKey: 'id',
            rightKey: 'id'
        },
        'permissions': {
            model: 'Permission',
            type: 'hasAndBelongsToMany',
            leftKey: 'id',
            rightKey: 'id'
        }
    }
};

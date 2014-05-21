var Helpers = require('../../helpers').models,
    Slug = Helpers.generateSlug,
    Hash = Helpers.generateUrlHash;

module.exports = {

    name: 'Role',

    schema: {
        name: String,
        description: {
            _type: String,
            default: ''
        },
        id: {
            _type: String,
            default: function () {
                if (this.name) {
                    return Hash(this.name);
                }
            }
        },
        type: {
            _type: String,
            default: 'role'
        },
        createdAt: {
            _type: Date,
            default: new Date()
        },
        updatedAt: {
            _type: Date,
            default: new Date()
        }
    },

    options: {
        enforce_missing: true
    },

    indexes: {
        'createdAt': true,
        'name': true
    },

    relations: {
        'permissions': {
            model: 'Permission',
            type: 'hasAndBelongsToMany',
            leftKey: 'id',
            rightKey: 'id'
        },
        'users': {
            model: 'User',
            type: 'hasAndBelongsToMany',
            leftKey: 'id',
            rightKey: 'id'
        },
        'createdBy': {
            model: 'User',
            type: 'belongsTo',
            leftKey: '_createdById',
            rightKey: 'id'
        },
        'updatedBy': {
            model: 'User',
            type: 'belongsTo',
            leftKey: '_updatedById',
            rightKey: 'id'
        }
    }
};

var Helpers = require('../../helpers').models,
    Slug = Helpers.generateSlug,
    Hash = Helpers.generateUrlHash;

module.exports = {

    name: 'Permission',

    schema: {
        action: String,
        actionFor: String,
        actionForId: {
            _type: String,
            default: ''
        },
        id: {
            _type: String,
            default: function () {
                if (this.action && this.actionFor) {

                    var slug;

                    if (this.actionForId) {
                        slug = Slug(this.action, this.actionFor, this.actionForId, '.');
                    } else {
                        slug = Slug(this.action, this.actionFor, '.');
                    }

                    return Hash(slug);
                }
            }
        },
        type: {
            _type: String,
            default: 'permission'
        },
        name: {
            _type: String,
            default: function () {
                if (this.action && this.actionFor) {
                    return Slug(this.action, this.actionFor, '.');
                }
            }
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
        'roles': {
            model: 'Role',
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

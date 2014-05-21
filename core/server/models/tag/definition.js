var Helpers = require('../../helpers').models,
    Slug = Helpers.generateSlug,
    Hash = Helpers.generateUrlHash;

module.exports = {

    name: 'Tag',

    schema: {
        name: String,
        id: {
            _type: String,
            default: function () {
                if (this.name) {
                    var slug = Slug((this.kind || 'tag'), this.name, '/');
                    return Hash(slug);
                }
            }
        },
        type: {
            _type: String,
            default: 'tag'
        },
        kind: {
            _type: String,
            default: 'tag'
        },
        key: {
            _type: String,
            default: function () {
                if (this.name) {
                    return Slug((this.kind || 'tag'), this.name, '/');
                }
            }
        },
        slug: {
            _type: String,
            default: function () {
                if (this.name) {
                    return Slug(this.name);
                }
            }
        },
        description: {
            _type: String,
            default: ''
        },
        createdAt: {
            _type: Date,
            default: new Date()
        },
        updatedAt: {
            _type: Date,
            default: new Date()
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

    map: {
        alias: function () {
            return this.getAlias();
        }
    },

    options: {
        enforce_missing: true
    },

    indexes: {
        'createdAt': true,
        'key': true,
        'name': true
    },

    relations: {
        'aliases': {
            model: 'Alias',
            type: 'hasMany',
            leftKey: 'id',
            rightKey: 'tagId'
        },
        'assets': {
            model: 'Asset',
            type: 'hasAndBelongsToMany',
            leftKey: 'id',
            rightKey: 'id'
        },
        'stories': {
            model: 'Story',
            type: 'hasAndBelongsToMany',
            leftKey: 'id',
            rightKey: 'id'
        },
        'ownedBy': {
            model: 'User',
            type: 'belongsTo',
            leftKey: '_ownedById',
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

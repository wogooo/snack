var Util = require('util'),
    Helpers = require('../../helpers').models,
    Slug = Helpers.generateSlug,
    Hash = Helpers.generateUrlHash;

module.exports = {

    name: 'Asset',

    schema: {
        key: String,
        filename: String,
        etag: {
            _type: String,
            default: ''
        },
        url: {
            _type: String,
            default: ''
        },
        mimetype: {
            _type: String,
            default: 'default'
        },
        bytes: {
            _type: Number,
            default: 0
        },
        height: {
            _type: Number,
            default: 0
        },
        width: {
            _type: Number,
            default: 0
        },
        data: {
            _type: Object,
            default: null
        },
        storage: {
            _type: String,
            default: 'local'
        },
        id: {
            _type: String,
            default: function () {
                return Hash(this.key);
            }
        },
        type: {
            _type: String,
            default: 'asset'
        },
        kind: {
            _type: String,
            default: function () {
                if (this.mimetype) {
                    return this.mimetype.split('/')[0];
                } else {
                    return 'file';
                }
            }
        },
        name: {
            _type: String,
            default: function () {
                return this.filename;
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
        _deleted_: {
            _type: Boolean,
            default: false
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
        validate: 'oncreate',
        validator: function () {

            if (this.bytes) {
                this.bytes = +this.bytes;
            }

            return true;
        }
    },

    indexes: {
        'createdAt': true,
        '_deleted_': true,
        'name': true,
        'key': true,
        'kind': true

    },

    relations: {
        'aliases': {
            model: 'Alias',
            type: 'hasMany',
            leftKey: 'id',
            rightKey: 'storyId'
        },
        'tags': {
            model: 'Tag',
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

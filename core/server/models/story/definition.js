var Util = require('util'),
    Helpers = require('../../helpers').models,
    Slug = Helpers.generateSlug,
    Hash = Helpers.generateUrlHash,
    HtmlStrip = require('htmlstrip-native').html_strip;

module.exports = {

    name: 'Story',

    schema: {
        type: {
            _type: String,
            default: 'story'
        },
        kind: {
            _type: String,
            default: 'article'
        },
        title: {
            _type: String,
            default: function () {
                if (this.headline) {
                    return HtmlStrip(this.headline).trim();
                } else {
                    return Util.format('New %s - %s', this.kind || 'article', new Date());
                }
            }
        },
        headline: {
            _type: String,
            default: ''
        },
        slug: {
            _type: String,
            default: function () {
                if (this.headline) {
                    return Slug(this.headline);
                }
            }
        },
        body: {
            _type: String,
            default: ''
        },
        language: {
            _type: String,
            default: 'en_US'
        },
        createdAt: {
            _type: Date,
            default: new Date()
        },
        updatedAt: {
            _type: Date,
            default: new Date()
        },
        publishedAt: {
            _type: Date,
            default: null
        },
        availableAt: {
            _type: Date,
            default: new Date()
        },
        status: {
            _type: String,
            default: 'draft'
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
        enforce_missing: true
    },

    map: {
        alias: function () {
            return this.getAlias();
        }
    },

    indexes: {
        'createdAt': true,
        'publishedAt': true,
        'availableAt': true,
        'status': true,
        'slug': true
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
        'assets': {
            model: 'Asset',
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

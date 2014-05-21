var Helpers = require('../../helpers').models,
    Hash = Helpers.generateUrlHash;

module.exports = {

    name: 'Alias',

    schema: {
        key: String,
        primary: {
            _type: Boolean,
            default: false
        },
        auto: {
            _type: Boolean,
            deafult: false
        },
        id: {
            _type: String,
            default: function () {
                if (this.key) {
                    return Hash(this.key);
                }
            }
        },
        type: {
            _type: String,
            default: 'alias'
        },
        statusCode: {
            _type: Number,
            default: function () {
                return (this.primary ? 200 : 302);
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
        enforce_missing: false
    },

    indexes: {
        'createdAt': true,
        'key': true
    },

    relations: {
        'tag': {
            model: 'Tag',
            type: 'belongsTo',
            leftKey: 'tagId',
            rightKey: 'id'
        },
        'story': {
            model: 'Story',
            type: 'belongsTo',
            leftKey: 'storyId',
            rightKey: 'id'
        },
        'asset': {
            model: 'Asset',
            type: 'belongsTo',
            leftKey: 'assetId',
            rightKey: 'id'
        }
    }
};

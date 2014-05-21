var Helpers = require('../../helpers').models,
    Slug = Helpers.generateSlug,
    Hash = Helpers.generateUrlHash;

module.exports = {

    name: 'Setting',

    schema: {
        key: String,
        value: String,
        group: String,
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
            default: 'setting'
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
        'key': true
    },

    relations: {
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

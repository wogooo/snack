var Schema = require('jugglingdb').Schema;
var utile = require('utile');
var _ = require('lodash');


var model = {};

model.dependencies = ['User'];

model.register = function (schema, models, options, next) {

    var Post = schema.define('Post', {
        id: {
            type: String,
            index: true
        },
        title: {
            type: String,
            length: 255
        },
        content: {
            type: Schema.Text
        },
        date: {
            type: Date,
            default: function () {
                return new Date;
            }
        },
        timestamp: {
            type: Number,
            default: Date.now
        },
        published: {
            type: Boolean,
            default: false,
            index: true
        }
    });

    Post.hasAndBelongsToMany('authors', {
        model: models.User
    });

    Post.getAll = function(fields, options, callback) {
        fields = fields || [];
        options = options || {};

        this.all({ include: fields }, function(err, results) {

            if (err) {
                return callback(err);
            }

            if (options.toJSON) {

                var resultJSON, relations;
                results.forEach(function (result, index) {
                    relations = result.__cachedRelations;
                    resultJSON = result.toJSON();
                    resultJSON = _.extend(resultJSON, relations);
                    results[index] = resultJSON;
                });
            }

            callback(err, results);
        });
    };

    models.Post = Post;

    next();
};

module.exports = model;

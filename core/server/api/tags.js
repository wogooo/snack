var Hapi = require('hapi'),
    Hoek = require('hoek'),
    Promise = require('bluebird');

var Helpers = require('../helpers').api;

function Tags (options) {

    this.models = options.models;
    this.config = options.config;
    this.api = options.api;
    this.check = options.snack.permissions.check;
}

Tags.prototype.list = function (options, context, done) {

    var Models = this.models,
        Tag = Models.Tag;

    Tag.find(options)
        .bind({})
        .then(function (tagList) {
            done(null, tagList);
        })
        .catch (function (err) {
            done(err);
        });
};

Tags.prototype.read = function (options, context, done) {

    var Models = this.models,
        Tag = Models.Tag;

    Tag.findOne(options)
        .then(function (tag) {
            if (!tag) return done(Hapi.error.notFound());
            done(null, tag);
        })
        .catch (function (err) {
            done(Hapi.error.badImplementation(err.message));
        });
};

Tags.prototype.create = function (options, context, done) {

    var Models = this.models,
        Tag = Models.Tag,
        Alias = Models.Alias,
        Config = this.config;

    var payload = options.payload,
        implicit = Boolean(options.implicit === true),
        multi,
        tasks = [],
        task;

    if (!payload) {
        return done(Hapi.error.badRequest());
    }

    function createTag(item) {

        return Tag
            .create(item)
            .bind({})
            .then(function (tag) {

                this.tag = tag;
                tagAlias = Config.createAlias(tag);
                return Alias.createUnique(tagAlias);
            })
            .then(function (alias) {

                alias.primary = true;
                this.tag.aliases = [ alias ];
                return this.tag.saveAll();
            })
            .then(function (tag) {

                return this.tag.enqueue('created');
            })
            .catch(function (err) {

                if (err && err.code === 409 && err.rejectedKey) {
                    return Tag.findOne(err.rejectedKey);
                } else {
                    throw err;
                }
            });
    }

    if (payload.items && payload.items instanceof Array) {

        // Can create many tags at once.
        multi = true;

        for (var i in payload.items) {
            task = createTag(items[i]);
            tasks.push(task);
        }

    } else {

        // Or a single tag.
        multi = false;

        task = createTag(payload);
        tasks.push(task);
    }

    Promise
        .all(tasks)
        .then(function(tags) {

            done(null, multi ? tags : tags[0]);
        })
        .catch(function (err) {

            done(err);
        });
};

Tags.prototype.edit = function (options, context, done) {

    var Models = this.models,
        Tag = Models.Tag,
        Check = this.check;

    var payload = options.payload;
    var user = context.user;

    Check(user)
        .edit
        .tag(options.where)
        .then(function () {
            return Tag.update(payload, options);
        })
        .then(function (tag) {

            if (!options.clearQueue) {
                return tag.enqueue('edited');
            }
            return tag;
        })
        .then(function (tag) {

            done(null, tag)
        })
        .catch(function (err) {

            console.log(err);
            done(err);
        });

};

Tags.prototype.remove = function (options, context, done) {

    var Models = this.models,
        Tag = Models.Tag;

    // Tags are always destroyed.
    Tag
        .destroy(options)
        .then(function (tag) {

            return tag.enqueue('destroyed');
        })
        .then(function (tag) {

            var results = {
                message: 'Destroyed'
            };

            done(null, results);
        })
        .catch(function (err) {
            done(err);
        });
};

module.exports = function (root) {

    var tags = new Tags(root);
    return tags;
};

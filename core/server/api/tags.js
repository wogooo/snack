var Hapi = require('hapi'),
    Hoek = require('hoek'),
    Promise = require('bluebird'),
    Helpers = require('../helpers').api;

function Tags(options) {

    this.models = options.models;
    this.config = options.config;
    this.api = options.api;
    this.check = options.snack.permissions.check;
}

Tags.prototype.list = function (options, context, done) {

    var Models = this.models,
        Tag = Models.Tag;

    Tag
        .find(options)
        .then(function (tagList) {
            done(null, tagList);
        })
        .catch(function (err) {
            done(err);
        });
};

Tags.prototype.read = function (options, context, done) {

    var Models = this.models,
        Tag = Models.Tag;

    Tag
        .findOne(options)
        .then(function (tag) {

            if (!tag) {
                return done(Hapi.error.notFound());
            }

            done(null, tag);
        })
        .catch(function (err) {

            done(err);
        });
};

Tags.prototype.create = function (options, context, done) {

    var Models = this.models,
        Tag = Models.Tag,
        Check = this.check;

    var data = options.payload,
        user = context.user,
        implicit = Boolean(options.implicit === true),
        multi,
        tasks = [],
        task;

    if (!data) {
        return done(Hapi.error.badRequest());
    }

    function createTag(item) {

        return Tag
            .create(data)
            .then(function (tag) {

                return tag.createAlias(null, true);
            })
            .then(function (tag) {

                return tag.saveAll();
            })
            .catch(function (err) {

                if (err && err.code === 409 && err.rejectedKey) {

                    return Tag.findOne({
                        where: {
                            id: err.rejectedKey
                        },
                        include: '*'
                    });

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

    var createTags = Promise.all(tasks);

    Check(user)
        .create
        .tag()
        .then(function (allowed) {

            if (!allowed) {
                throw Hapi.error.unauthorized();
            }

            return createTags;
        })
        .then(function (tags) {

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

    var payload = options.payload,
        user = context.user;

    Check(user)
        .edit
        .tag(options.where)
        .then(function (allowed) {

            if (!allowed) {
                throw Hapi.error.unauthorized();
            }

            return Tag.update(payload, options);
        })
        .then(function (tag) {

            if (!options.clearQueue) {
                return tag.enqueue('edited');
            }

            return tag;
        })
        .then(function (tag) {

            done(null, tag);
        })
        .catch(function (err) {

            done(err);
        });

};

Tags.prototype.remove = function (options, context, done) {

    var Models = this.models,
        Tag = Models.Tag,
        Check = this.check;

    var user = context.user;

    // Tags are always destroyed.
    Check(user)
        .remove
        .tag(options.where)
        .then(function (allowed) {

            if (!allowed) {
                throw Hapi.error.unauthorized();
            }

            return Tag.destroy(options);
        })
        .then(function (tag) {

            return tag.enqueue('destroyed');
        })
        .then(function (tag) {

            done(null, 'destroyed');
        })
        .catch(function (err) {

            done(err);
        });
};

module.exports = function (root) {

    return new Tags(root);
};

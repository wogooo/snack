var Hapi = require('hapi'),
    Hoek = require('hoek'),
    Helpers = require('../helpers').api;

function Stories(options) {

    this.models = options.snack.models;
    this.check = options.snack.permissions.check;
    this.api = options.api;
}

Stories.prototype.list = function (options, context, done) {

    var Story = this.models.Story;

    if (!context.user) {
        options.where = options.where || {};
        options.where.status = 'published';
        options.where.availableAt = {
            lte: new Date()
        };
    }

    Story
        .find(options)
        .then(function (storyList) {
            done(null, storyList);
        })
        .caught(function (err) {
            done(err);
        });
};

Stories.prototype.read = function (options, context, done) {

    var Story = this.models.Story;

    if (!context.user) {
        options.where = options.where || {};
        options.where.status = 'published';
        options.where.availableAt = {
            lte: new Date()
        };
    }

    Story
        .findOne(options)
        .then(function (story) {

            if (!story) {
                throw Hapi.error.notFound();
            }

            done(null, story);
        })
        .caught(function (err) {

            done(err);
        });
};

Stories.prototype.create = function (options, context, done) {

    var Story = this.models.Story,
        Check = this.check;

    var user = context.user,
        data = options.payload,
        alias = options.alias || null;

    Check(user)
        .create
        .story()
        .bind({})
        .then(function (allowed) {

            if (!allowed) {
                throw Hapi.error.unauthorized();
            }

            var relations = {};

            if (!data.ownedBy) {
                data.ownedBy = user;
            }

            data.createdBy = data.updatedBy = user;

            return Story.create(data);
        })
        .then(function (story) {

            this.story = story;

            if (story.status !== 'pending') {
                return story.createAlias();
            }
        })
        .then(function (story) {

            if (story.status !== 'pending') {
                return story.enqueue('created');
            }
        })
        .then(function (job) {

            this.job = job;

            if (job) {
                this.story._queue_.unshift({
                    id: job.id,
                    path: job.path
                });
            }

            return this.story.save();
        })
        .then(function (story) {

            if (this.job) {
                this.job.start();
            }

            done(null, story);
        })
        .catch(function (err) {

            done(err);
        });
};

Stories.prototype.edit = function (options, context, done) {

    var Story = this.models.Story,
        Check = this.check;

    var data = options.payload,
        user = context.user;

    options.include = options.include || {};
    options.include.aliases = true;

    return Check(user)
        .edit
        .story(options.where)
        .bind({})
        .then(function (allowed) {

            if (!allowed) {
                throw Hapi.error.unauthorized();
            }

            if (!user._api_) {
                data.updatedBy = user;
            }

            return Story.update(data, options);
        })
        .then(function (story) {

            this.story = story;

            if (story.status !== 'pending' && story.aliases.length === 0) {

                return story.createAlias();

            } else if (story.status === 'draft') {

                return story.replaceAlias();
            }
        })
        .then(function () {

            storyOld = this.story.getOldValue();

            if (this.story.status !== 'pending' && storyOld.status === 'pending') {

                return this.story.enqueue('created');

            } else if (!options.clearQueue) {

                return this.story.enqueue('edited');
            }
        })
        .then(function (job) {

            this.job = job;

            if (job) {
                this.story._queue_.unshift({
                    id: job.id,
                    path: job.path
                });
            }

            return this.story.save();
        })
        .then(function (story) {

            if (this.job) {
                this.job.start();
            }

            done(null, story);
        })
        .catch(function (err) {

            done(err);
        });
};

Stories.prototype.remove = function (options, context, done) {

    var Story = this.models.Story,
        Check = this.check;

    var user = context.user;

    Check(user)
        .remove
        .story(options.where)
        .then(function (allowed) {

            if (!allowed) {
                throw Hapi.error.unauthorized();
            }

            if (options.destroy) {
                return Story.destroy(options);
            } else {
                return Story.update({
                    status: 'deleted'
                }, options);
            }

        })
        .then(function (story) {

            return story.enqueue(options.destroy ? 'destroyed' : 'deleted');
        })
        .then(function (story) {

            done(null, options.destroy ? 'destroyed' : 'deleted');
        })
        .catch(function (err) {

            done(err);
        });
};

module.exports = function (root) {

    return new Stories(root);
};

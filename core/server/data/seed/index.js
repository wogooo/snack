var Async = require('async');

var internals = {};

internals.seed = {
    posts: [{
        "title": "Sample",
        "key": "sample",
        "body": "Simple starter post.",
        "page": false,
        "language": "en_US"
    }],

    tags: [{
        "name": "Getting Started",
        "key": "tag/getting-started",
        "description": null,
    }],

    roles: [{
        "name": "administrator",
        "description": "Administrators"
    }, {
        "name": "editor",
        "description": "Editors"
    }, {
        "name": "author",
        "description": "Authors"
    }],

    permissions: [{
        "name": "Edit posts",
        "action": "edit",
        "for": "post"
    }, {
        "name": "Remove posts",
        "action": "remove",
        "for": "post"
    }, {
        "name": "Create posts",
        "action": "create",
        "for": "post"
    }]
};

exports.register = function (root, done) {

    var Server = root.server,
        Snack = root.snack,
        Models = Snack.models,
        seed = internals.seed;

    root.seedTasks = function () {

        var tasks = [];

        tasks.push(function seedPosts(next) {
            var createPost = function (post, cb) {
                post = new Models.Post(post);
                post.save(cb);
            };
            Async.eachSeries(seed.posts, createPost, next);
        });

        tasks.push(function seedTags(next) {
            var createTag = function (tag, cb) {
                tag = new Models.Tag(tag);
                tag.save(cb);
            };
            Async.eachSeries(seed.tags, createTag, next);
        });


        tasks.push(function seedRoles(next) {
            var createRole = function (role, cb) {
                role = new Models.Role(role);
                role.save(cb);
            };
            Async.eachSeries(seed.roles, createRole, next);
        });

        tasks.push(function seedPermissions(next) {
            var createPermission = function (perm, cb) {
                perm = new Models.Permission(perm);
                perm.save(cb);
            };
            Async.eachSeries(seed.permissions, createPermission, next);
        });

        return tasks;
    };

    done();
};

var Async = require('async');
var Prompt = require('prompt');

var internals = {};

internals.seed = {
    users: [{
        "displayName": "Admin",
        "username": "admin",
        "body": "Simple starter post.",
        "page": false,
        "language": "en_US"
    }],

    posts: [{
        "headline": "Sample Post",
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
        "actionFor": "Post"
    }, {
        "name": "Remove posts",
        "action": "remove",
        "actionFor": "Post"
    }, {
        "name": "Create posts",
        "action": "create",
        "actionFor": "Post"
    }]
};

exports.getTasks = function (snack) {

    var Snack = snack,
        Models = Snack.models,
        seed = internals.seed,
        user = {};

    var tasks = [];

    tasks.push(function getUserInfo(next) {

        console.log("---".grey,
                    "\nCreate the first user:\n");

        Prompt.delimiter = '';
        Prompt.start();

        var userSchema = {
            properties: {
                username: {
                    description: 'Username:',
                    pattern: /^[a-zA-Z\s\-]+$/,
                    message: 'Name must be only letters, spaces, or dashes',
                    required: true
                },
                email: {
                    description: 'Email:',
                    pattern: /.+@.+\..+/,
                    message: 'Come on, that\'s not a real email!',
                    required: true
                },
                password: {
                    description: 'Password:',
                    hidden: true,
                    required: true
                }
            }
        };

        Prompt.get(userSchema, function (err, result) {
            user = result;
            next(err);
        });
    });

    tasks.push(function createUser(next) {

        console.log("Creating user...".blue);

        Models.User.create(user, function (err, u) {
            if (err) return next(err);

            console.log("\u2713 User created".green);
            user = u;

            next(err);
        });
    });

    tasks.push(function seedRoles(next) {

        console.log("Creating roles...".blue);

        var createRole = function (role, cb) {

            role.createdById = user.id;

            Models.Role.create(role, function (err) {
                cb(err);
            });
        };

        Async.eachSeries(seed.roles, createRole, function (err) {
            console.log("\u2713 Roles created".green);
            next(err);
        });
    });

    tasks.push(function seedPermissions(next) {

        console.log("Creating permissions...".blue);

        var createPermission = function (perm, cb) {

            perm.createdById = user.id;

            Models.Permission.create(perm, function (err, permission) {
                if (err) return cb(err);
                Models.Role.findBy('name', 'administrator', function (err, role) {
                    if (err) return cb(err);
                    permission.roles.add(role, cb);
                });
            });
        };
        Async.eachSeries(seed.permissions, createPermission, function (err) {
            console.log("\u2713 Permissions created".green);
            next(err);
        });
    });

    tasks.push(function blessUser(next) {

        console.log("Blessing user...".blue);

        var blessUser = function (user, cb) {

            Models.Role.findBy('name', 'administrator', function (err, role) {

                if (err) return cb(err);

                user.roles.add(role, function (err) {
                    cb(err);
                });
            });
        };

        blessUser(user, function (err) {
            console.log("\u2713 User blessed".green);
            next(err);
        });
    });

    tasks.push(function seedTags(next) {

        console.log("Creating tags...".blue);

        var createTag = function (tag, cb) {

            tag.createdById = user.id;

            Models.Tag.create(tag, function (err) {
                cb(err);
            });
        };

        Async.eachSeries(seed.tags, createTag, function (err) {
            console.log("\u2713 Tags created".green);
            next(err);
        });
    });

    tasks.push(function seedPosts(next) {

        console.log("Creating posts...".blue);

        var createPost = function (post, cb) {

            post.createdById = user.id;

            Models.Post.create(post, function (err, post) {
                if (err) return cb(err);
                Models.Tag.findBy('key', 'tag/getting-started', function (err, tag) {
                    if (err) return cb(err);
                    post.tags.add(tag, cb);
                });
            });
        };

        Async.eachSeries(seed.posts, createPost, function (err) {
            console.log("\u2713 Posts created".green);
            next(err);
        });
    });

    return tasks;
};

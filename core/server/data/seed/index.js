var Async = require('async');
var Prompt = require('prompt');

var internals = {};

internals.seed = {
    users: [{
        "displayName": "Snack Machine",
        "username": "snackMachine",
        "_api_": true
    }],

    posts: [{
        "headline": "Sample Post",
        "key": "sample",
        "body": "Simple starter post.",
        "page": false,
        "language": "en_US"
    }, {
        "headline": "Cum Sociis",
        "key": "cum-sociis",
        "body": "Pellentesque habitant morbi tristique senectus et netus. Ab illo tempore, ab est sed immemorabili. Cum ceteris in veneratione tui montes, nascetur mus. Gallia est omnis divisa in partes tres, quarum. Phasellus laoreet lorem vel dolor tempus vehicula. Fictum,  deserunt mollit anim laborum astutumque!",
        "page": false,
        "language": "en_US",
        "availableAt": new Date(2014, 3, 17, 8)
    }, {
        "headline": "Natoque Penatibus",
        "key": "natoque-penatibus",
        "body": "Morbi odio eros, volutpat ut pharetra vitae, lobortis sed nibh. Salutantibus vitae elit libero, a pharetra augue. Curabitur est gravida et libero vitae dictum. Quisque ut dolor gravida, placerat libero vel, euismod. A communi observantia non est recedendum. Quisque ut dolor gravida, placerat libero vel, euismod.",
        "page": false,
        "language": "en_US",
        "availableAt": new Date(2014, 3, 16, 8)
    }, {
        "headline": "Et Magnis Dis",
        "key": "et-magnis-dis",
        "body": "Prima luce, cum quibus mons aliud  consensu ab eo. Magna pars studiorum, prodita quaerimus. Idque Caesaris facere voluntate liceret: sese habere. Ullamco laboris nisi ut aliquid ex ea commodi consequat. Quo usque tandem abutere, Catilina, patientia nostra? Quis aute iure reprehenderit in voluptate velit esse.",
        "page": false,
        "language": "en_US",
        "availableAt": new Date(2014, 3, 19, 8)
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
        users = seed.users;

    var tasks = [];

    tasks.push(function getUserInfo(next) {

        console.info("#grey{---}\
                    \nCreate the first user:\
                    \n");

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

        Prompt.get(userSchema, function (err, user) {
            users.unshift(user);
            next(err);
        });
    });

    tasks.push(function createUsers(next) {

        console.info("#blue{Creating users...}");

        var userIndex = 0;

        var createUser = function (u, cb) {
            Models.User.create(u, function (err, user) {
                if (err) return cb(err);

                users[userIndex] = user;
                userIndex++;

                cb();
            });
        };

        Async.eachSeries(users, createUser, function (err) {
            console.info("#green{\u2713 Users created}");
            next(err);
        });
    });

    tasks.push(function seedRoles(next) {

        console.info("#blue{Creating roles...}");

        var createRole = function (role, cb) {

            role.createdById = users[0].id;

            Models.Role.create(role, function (err) {
                cb(err);
            });
        };

        Async.eachSeries(seed.roles, createRole, function (err) {
            console.info("#green{\u2713 Roles created}");
            next(err);
        });
    });

    tasks.push(function seedPermissions(next) {

        console.info("#blue{Creating permissions...}");

        var createPermission = function (perm, cb) {

            perm.createdById = users[0].id;

            Models.Permission.create(perm, function (err, permission) {
                if (err) return cb(err);
                Models.Role.findBy('name', 'administrator', function (err, role) {
                    if (err) return cb(err);
                    permission.roles.add(role, cb);
                });
            });
        };
        Async.eachSeries(seed.permissions, createPermission, function (err) {
            console.info("#green{\u2713 Permissions created}");
            next(err);
        });
    });

    tasks.push(function blessUsers(next) {

        console.info("#blue{Blessing users...}");

        var blessUser = function (user, cb) {

            Models.Role.findBy('name', 'administrator', function (err, role) {
                if (err) return cb(err);
                user.roles.add(role, function (err) {
                    cb(err);
                });
            });
        };

        Async.eachSeries(users, blessUser, function (err) {
            console.info("#green{\u2713 Users blessed}");
            next(err);
        });
    });

    tasks.push(function seedTags(next) {

        console.info("#blue{Creating tags...}");

        var createTag = function (tag, cb) {

            tag.createdById = users[0].id;

            Models.Tag.create(tag, function (err) {
                cb(err);
            });
        };

        Async.eachSeries(seed.tags, createTag, function (err) {
            console.info("#green{\u2713 Tags created}");
            next(err);
        });
    });

    tasks.push(function seedPosts(next) {

        console.info("#blue{Creating posts...}");

        var createPost = function (post, cb) {

            post.createdById = users[0].id;

            Models.Post.create(post, function (err, post) {
                if (err) return cb(err);
                Models.Tag.findBy('key', 'tag/getting-started', function (err, tag) {
                    if (err) return cb(err);
                    post.tags.add(tag, cb);
                });
            });
        };

        Async.eachSeries(seed.posts, createPost, function (err) {
            console.info("#green{\u2713 Posts created}");
            next(err);
        });
    });

    return tasks;
};

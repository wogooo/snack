var Hoek = require('hoek'),
    Async = require('async'),
    Promise = require('bluebird'),
    Prompt = require('prompt'),
    GeneratePassword = require('../../helpers').models.generateRandomPassword;

var internals = {};

internals.seed = {
    apiUser: {
        "displayName": "Snack Machine",
        "username": "snackMachine",
        "status": "active",
        "kind": "api"
    },

    stories: [{
        "headline": "Sample Post",
        "body": "Simple starter post.",
        "language": "en_US"
    }, {
        "headline": "Cum Sociis",
        "body": "Pellentesque habitant morbi tristique senectus et netus. Ab illo tempore, ab est sed immemorabili. Cum ceteris in veneratione tui montes, nascetur mus. Gallia est omnis divisa in partes tres, quarum. Phasellus laoreet lorem vel dolor tempus vehicula. Fictum,  deserunt mollit anim laborum astutumque!",
        "language": "en_US",
        "availableAt": new Date(2014, 3, 28, 8)
    }, {
        "headline": "Natoque Penatibus",
        "body": "Morbi odio eros, volutpat ut pharetra vitae, lobortis sed nibh. Salutantibus vitae elit libero, a pharetra augue. Curabitur est gravida et libero vitae dictum. Quisque ut dolor gravida, placerat libero vel, euismod. A communi observantia non est recedendum. Quisque ut dolor gravida, placerat libero vel, euismod.",
        "language": "en_US",
        "availableAt": new Date(2014, 3, 29, 8)
    }, {
        "headline": "Et Magnis Dis",
        "body": "Prima luce, cum quibus mons aliud  consensu ab eo. Magna pars studiorum, prodita quaerimus. Idque Caesaris facere voluntate liceret: sese habere. Ullamco laboris nisi ut aliquid ex ea commodi consequat. Quo usque tandem abutere, Catilina, patientia nostra? Quis aute iure reprehenderit in voluptate velit esse.",
        "language": "en_US",
        "availableAt": new Date(2014, 3, 30, 8)
    }],

    tags: [{
        "name": "Getting Started",
        "description": "Your very first tag."
    }, {
        "name": "Kittens",
        "description": "And another."
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
        "name": "Edit stories",
        "action": "edit",
        "actionFor": "story"
    }, {
        "name": "Remove stories",
        "action": "remove",
        "actionFor": "story"
    }, {
        "name": "Create stories",
        "action": "create",
        "actionFor": "story"
    }, {
        "name": "Edit users",
        "action": "edit",
        "actionFor": "user"
    }, {
        "name": "Remove users",
        "action": "remove",
        "actionFor": "user"
    }, {
        "name": "Create users",
        "action": "create",
        "actionFor": "user"
    }, {
        "name": "Create tags",
        "action": "create",
        "actionFor": "tag"
    }, {
        "name": "Edit tags",
        "action": "edit",
        "actionFor": "tag"
    }, {
        "name": "Remove tags",
        "action": "remove",
        "actionFor": "tag"
    }, {
        "name": "Create assets",
        "action": "create",
        "actionFor": "asset"
    }, {
        "name": "Edit assets",
        "action": "edit",
        "actionFor": "asset"
    }, {
        "name": "Remove assets",
        "action": "remove",
        "actionFor": "asset"
    }]
};

exports.getTasks = function (snack) {

    var Snack = snack,
        Models = Snack.models,
        Api = Snack.api,
        seed = internals.seed,
        apiUser = seed.apiUser,
        adminUser = {};

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

            apiUser.email = user.email;
            apiUser.password = GeneratePassword();

            adminUser = user;
            adminUser.status = 'active';

            next(err);
        });
    });

    tasks.push(function createUsers(next) {

        console.info("#blue{Creating users...}");

        var tasks = [
            Models.User.create(adminUser),
            Models.User.create(apiUser)
        ];

        var apiKey = apiUser.username;
        var apiSecret = apiUser.password;

        Promise
            .all(tasks)
            .then(function (users) {

                adminUser = users[0];
                apiUser = users[1];

                console.info("#green{\u2713 Users created}");

                console.info("\n#blue{Snack Machine:}\
                              \n#grey{API key:} #bold{%s}\
                              \n#grey{API secret:} #bold{%s}\
                              \n", apiKey, apiSecret);

                next();
            })
            .catch(function (err) {

                next(err);
            });
    });

    tasks.push(function seedRoles(next) {

        console.info("#blue{Creating roles...}");

        var createRole = function (data, cb) {

            data = Hoek.merge(data, {
                createdBy: adminUser,
                updatedBy: adminUser
            });

            Models.Role
                .create(data)
                .then(function (role) {
                    cb();
                })
                .catch(function (err) {
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

        function createPermission(data, cb) {

            data = Hoek.merge(data, {
                createdBy: adminUser,
                updatedBy: adminUser
            });

            Models.Permission
                .create(data)
                .bind({})
                .then(function (permission) {

                    this.permission = permission;
                    return Models.Role.findOne({
                        name: 'administrator'
                    });
                })
                .then(function (role) {

                    this.permission.add('roles', role);
                    return this.permission.saveAll();
                })
                .then(function (permission) {

                    cb();
                })
                .catch(function (err) {

                    cb(err);
                });
        }

        Async.eachSeries(seed.permissions, createPermission, function (err) {
            console.info("#green{\u2713 Permissions created}");
            next(err);
        });
    });

    tasks.push(function blessUsers(next) {

        console.info("#blue{Blessing users...}");

        var blessUser = function (user, cb) {

            return Models.Role
                .findOne({
                    name: 'administrator'
                })
                .then(function (role) {

                    user.add('roles', role);
                    return user.saveAll();
                })
        };

        var tasks = [
            blessUser(adminUser),
            blessUser(apiUser)
        ];

        Promise
            .all(tasks)
            .then(function (users) {

                console.info("#green{\u2713 Users blessed}");
                next();
            })
            .catch(function (err) {

                next(err);
            });
    });

    tasks.push(function seedTags(next) {

        console.info("#blue{Creating tags...}");

        var createTag = function (data, cb) {

            data = Hoek.merge(data, {
                ownedBy: adminUser,
                createdBy: adminUser,
                updatedBy: adminUser
            });

            Models.Tag
                .create(data)
                .then(function (tag) {

                    return tag.createAlias();
                })
                .then(function (tag) {

                    return tag.saveAll();
                })
                .then(function (tag) {
                    cb();
                })
                .catch(function (err) {
                    cb(err);
                });
        };

        Async.eachSeries(seed.tags, createTag, function (err) {
            console.info("#green{\u2713 Tags created}");
            next(err);
        });
    });

    tasks.push(function seedStories(next) {

        console.info("#blue{Creating stories...}");

        var createStory = function (data, cb) {

            data = Hoek.merge(data, {
                ownedBy: adminUser,
                createdBy: adminUser,
                updatedBy: adminUser
            });

            Models.Story
                .create(data)
                .bind({})
                .then(function (story) {

                    this.story = story;

                    return this.story.createAlias();
                })
                .then(function (story) {

                    return Models.Tag.findOne({
                        name: 'Getting Started'
                    });
                })
                .then(function (tag) {

                    this.story.add('tags', tag);

                    return this.story.saveAll();
                })
                .then(function (story) {
                    cb();
                })
                .catch(function (err) {
                    cb(err);
                });
        };

        Async.eachSeries(seed.stories, createStory, function (err) {
            console.info("#green{\u2713 Stories created}");
            next(err);
        });
    });

    return tasks;
};

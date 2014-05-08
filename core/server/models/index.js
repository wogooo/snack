var Hapi = require('hapi');
var Hoek = require('hoek');
var Async = require('async');
var Schema = require('jugglingdb').Schema;
var Helpers = require('../helpers').models;

var internals = {};

internals.Models = function (options) {

    options = options || {};

    this._models = {};
    this._after = [];

    this.server = options.server;
    this.config = options.config;
    this.schema = options.schema;
};

internals.Models.prototype.register = function (names, done) {

    var self = this;

    var root = {};

    root.server = this.server;
    root.snack = this.server.app;
    root.config = this.config;
    root.schema = this.schema;
    root.models = this._models;
    root.enqueue = Helpers.enqueue(this.server);

    root.expose = function (Model) {

        var modelName;

        if (Model.getTableName) {
            modelName = Model.getTableName();

        } else {
            modelName = Model.modelName;
        }

        self._models[modelName] = Model;
    };

    root.after = function (method) {

        self._after.push(method);
    };

    Async.eachSeries(names, function (modelName, next) {

        require(modelName).register(root, next);

    }, function (err) {

        Async.eachSeries(self._after, function (afterItem, next) {

            afterItem(root, next);

        }, function (err) {

            // TODO: There need to be dbInit / dbUpdate user events
            // that cause this to happen. Shouldn't be modifying
            // tables on every startup.

            // self.schema.autoupdate(function () {

            done(err, self._models);
            // });
        });
    });
};

internals.init = function (server, next) {

    var Snack = server.app;

    var config = {
        server: server,
        config: Snack.config,
        schema: Snack.services.schema
    };

    var models = new internals.Models(config);

    var modelNames = [
        './setting',
        './alias',
        './permission',
        './role',
        './user',
        './asset',
        './post',
        './tag'
    ];

    models.register(modelNames, function (err, _models) {

        Snack.models = _models;

        // var tag = Snack.models.Tag.create({
        //     name: 'Yo New Mama',
        //     kind: 'baz'
        // });

        var Tag = Snack.models.Tag;
        var Alias = Snack.models.Alias;

        setTimeout(function () {

            // Tag.update({
            //     id: 'baz/yo-new-mama',
            //     name: 'Newest'
            //     // test: {
            //     //     email: 'foo@goo.com',
            //     //     contact: 'blah'
            //     // }
            // });

            // Tag.update({
            //     id: 'baz/test',
            //     name: 'Test',
            //     test: {
            //         contact: 'cow'
            //     }
            // });

            // Alias.createUnique('foo/bar');

            // Tag.get('baz/test').getJoin().run().then(function (tag) {
            //     console.log('the tag', tag);
            // });

        }, 1000);
        // var result = Alias.createUnique('foo/bar');

        // result.then(function (created) {
        //     console.log('created', created);
        // })
        // .catch(function (err) {
        //     console.log('err', err);
        // });

        // var data = {
        //     name: 'Yo Again Mama'
        // };

        // Tag.get('bar/yo-new-mama').run().then(function(tag) {
        //     tag.merge(data).save().then(function(result) {
        //         // post was updated with `data`
        //     });
        // });

        // var tag = new Snack.models.Tag({
        //     name: 'Yo New Mama',
        //     kind: 'bar'
        // });

        // tag.aliases = [];

        // var alias1 = new Snack.models.Alias({
        //     id: 'blah/tag/foo-bar-1'
        // });

        // var alias2 = new Snack.models.Alias({
        //     id: 'blah/tag/foo-bar'
        // });


        // tag.aliases = [alias1, alias2];

        // tag.saveAll();

        next(err);
    });
};

exports.init = internals.init;

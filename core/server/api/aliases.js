var Async = require('async');
var Hapi = require('hapi');
var Hoek = require('hoek');

var internals = {};

function Aliases(options) {

    this.models = options.models;
    this.config = options.config;
    this.api = options.api;
};

Aliases.prototype.list = function (args, done) {

    var Models = this.models,
        Api = this.api,
        query = args.query,
        options = query,
        list;

    var get = Api.base.listParams(options);

    Models.Tag.all(get, function (err, tags) {

        list = {
            type: 'tagList',
            sort: get.order.split(' ')[1].toLowerCase(),
            order: get.order.split(' ')[0],
            offset: get.skip,
            limit: get.limit,
            count: tags.length,
            items: tags
        };

        done(err, err ? null : list);
    });
};

Aliases.prototype.create = function (options, context, done) {

    var Models = this.models,
        Alias = Models.Alias,
        payload = options.payload,
        generateUnique = Boolean(options.generateUnique === true);

    // if (generateUnique) {


    // } else {
    //     try {

    //         var alias = Alias.create(payload);

    //         alias.then(function (alias) {
    //             done()
    //         })
    //         .catch(function () {

    //         });

    //     } catch (err) {
    //         done(Hapi.error.badRequest(err.message));
    //     }
    // }

// internals.Base.prototype.findUniqueKey = function (modelName, keyBase, keyExt, keyIncrement, done) {

//     if (!keyBase) return done(Hapi.error.badImplementation('No base defined for key generation'));

//     var self = this,
//         retries = 10,
//         key = '';

//     key = keyBase;

//     if (typeof keyIncrement === 'number') {
//         key += '-' + keyIncrement;
//         keyIncrement++;
//     } else {
//         keyIncrement = 0;
//     }

//     key += keyExt ? keyExt : '';

//     this.keyExists(modelName, key, function (err, exists) {

//         if (err) return done(err);

//         if (exists && keyIncrement < retries) {

//             // Try again...
//             return self.findUniqueKey(modelName, keyBase, keyExt, keyIncrement, done);

//         } else if (exists && keyIncrement >= retries) {

//             // Retries exhausted
//             return done(Hapi.error.badRequest('Could not generate a unique asset key'));

//         } else {

//             done(null, key);
//         }
//     });
// };



//     var multi = true,
//         tags = [],
//         tag,
//         items = [];

//     // Can create 1 or many tags at once.
//     if (payload.items) {

//         items = payload.items;

//     } else {

//         items.push(payload);
//         multi = false;
//     }

//     Async.eachSeries(items, function (item, next) {

//             tag = new Models.Tag(item);

//             tag.isValid(function (valid) {

//                 // implicit creation shouldn't return
//                 // validation errors.
//                 if (!valid && implicit) return done();

//                 tag.save(function (err, t) {
//                     if (err) return next(err);

//                     tags.push(t);
//                     next();
//                 });
//             });
//         },
//         function (err) {
//             if (err) return done(err);

//             Api.base.enqueue(tags, 'tag.created', function (err) {
//                 if (err) return done(err);

//                 done(err, multi ? tags : tags[0]);
//             });
//         });
};

Aliases.prototype.read = function (args, done) {

    var Models = this.models,
        Api = this.api;

    var get = Api.base.readParams(args);

    if (!get) {

        return done(Hapi.error.badRequest());
    }

    Models.Tag[get.method](get.params, function (err, tag) {

        if (err) return done(err);

        if (!tag) {
            return done(Hapi.error.notFound());
        }

        done(err, tag);
    });
};

Aliases.prototype.edit = function (args, done) {

    var Models = this.models,
        Api = this.api,
        query = args.query,
        params = args.params,
        payload = args.payload,
        clearQueue = false,
        jobId;

    if (query.clearQueue) {
        clearQueue = true;
        jobId = parseInt(query.clearQueue, 10);
    }

    Models.Path.find(params.id, function (err, tag) {

        if (err) return done(err);

        if (!tag) {
            return done(Hapi.error.notFound());
        }

        // Simple version control
        if (query.version && tag._version_ !== query.version) {

            // Return conflict if version (timestamp) doesn't match
            return done(Hapi.error.conflict());
        }

        if (clearQueue) {

            // Pass in the private queue clearing flag
            tag.__data.clearQueue = jobId;
        }

        tag.updateAttributes(payload, function (err, tag) {

            if (!clearQueue) {

                Api.base.processRelations(tag, payload, function (err) {
                    Api.base.enqueue(tag, 'tag.updated', function (err) {
                        done(err, !err ? tag : null);
                    });
                });

            } else {

                done(err, !err ? tag : null);
            }
        });
    });
};

Aliases.prototype.remove = function (args, done) {

    var Models = this.models;
    var Api = this.api;

    var query = args.query;
    var params = args.params;

    Models.Tag.find(params.id, function (err, tag) {

        if (err) return done(err);

        if (!tag) {
            return done(Hapi.error.notFound());
        }

        // A true destructive delete
        tag.destroy(function (err) {
            Api.base.enqueue(tag, 'tag.destroyed', function (err) {
                var results = {
                    message: 'Destroyed'
                };
                done(err, results);
            });
        });
    });
};

module.exports = function (root) {

    return new Aliases(root);
};

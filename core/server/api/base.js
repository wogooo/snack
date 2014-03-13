var Async = require('async');
var Inflection = require('inflection');

var internals = {};

internals.Base = function (options) {

    this.server = options.server;
    this.config = options.config;
    this.api = options.api;
    this.models = options.models.models;
};

internals.Base.prototype._apiEndpoint = function (type, id) {

    var Config = this.config;

    if (!type || !id) {
        return '';
    }

    var context = 'api';

    var data = {
        api: {
            type: type,
            id: id
        }
    };

    var endpoint = Config.urlFor(context, data, true);

    return endpoint;
};

internals.Base.prototype._startJob = function (id) {

    var server = this.server;

    function start() {
        server.methods.queue('startJob', {
            id: id
        });
    }

    return start;
};

internals.Base.prototype._enqueue = function (hook, item, done) {

    var self = this;

    var Server = this.server;
    var Config = this.config;

    var endpoint = this._apiEndpoint(item.type, item.id);

    var task = {
        type: hook,
        data: {
            type: item.type,
            id: item.id,
            cleanup: Boolean(item.cleanup),
            endpoint: endpoint
        }
    };

    if (item.obj) {

        // It may be necessary to send the object with the job,
        // for example, in a delete.
        task.data.obj = JSON.stringify(item.obj);
    }

    Server.methods.queue('createJob', task, function (err, job) {

        if (err) return done(err);

        var queuePath = Config.urlFor('api', {
            api: {
                type: 'job',
                id: job.id
            }
        });

        var queued = {
            path: queuePath,
            start: self._startJob(job.id)
        };

        done(null, queued);
    });
};

internals.Base.prototype._enqueueItem = function (model, hook, next) {

    var queueItem = {
        type: model.type,
        id: model.id,
        cleanup: true
    };

    if (hook.search('.destroyed') > -1) {

        // When destroying, embed the model and no
        // cleanup required.
        queueItem.obj = model;
        queueItem.cleanup = false;
    }

    this._enqueue(hook, queueItem, function (err, queued) {

        if (queued) {

            var attr = {
                queue: queued.path
            };

            model.updateAttributes(attr, function (err, m) {

                model = m;
                queued.start();
                next(err);
            });

        } else {

            next(err);
        }
    });
};

internals.Base.prototype._enqueueArray = function (models, hook, done) {

    var self = this;

    // .each() might be faster, but sticking to series to avoid
    // overwhelming a DB.
    Async.each(models, function (model, next) {

            self._enqueueItem(model, hook, next);
        },
        function (err) {

            done(err, models);
        });
};

internals.Base.prototype.enqueue = function (models, hook, done) {

    var Config = this.config;
    var hooks = Config().hooks;

    if (!hooks[hook]) {

        // This hook is not enabled.
        return done();
    }

    if (models instanceof Array) {

        this._enqueueArray(models, hook, done);

    } else {

        this._enqueueItem(models, hook, done);
    }
};

internals.Base.prototype.getRelationInfo = function (modelName) {

    var Models = this.models;

    var relationInfo = {},
        relations = Models[modelName].relations,
        relationNames = Object.keys(relations);

    relationNames.forEach(function (relationName) {

        relation = relations[relationName];

        relationInfo[relationName] = {
            multiple: Boolean(relation.multiple),
            modelName: relation.modelTo.modelName,
            keyFrom: relation.keyFrom
        };
    });

    return relationInfo;
};

internals.Base.prototype.loadRelations = function (model, done) {

    var relationInfo = this.getRelationInfo(model.constructor.modelName);
    var relationNames = Object.keys(relationInfo);

    Async.eachSeries(relationNames, function (relationName, next) {

            model[relationName](next);
        },
        function (err) {

            done(err);
        });
};

internals.Base.prototype._findRelations = function (modelName, data) {

    var Api = this.api;
    var Models = this.models;

    var found = {
        ready: [],
        process: []
    };

    var relationInfo = this.getRelationInfo(modelName),
        relationNames = Object.keys(relationInfo),
        relInfo,
        processItem,
        handleRelation;

    var placeRelation = function (relationName) {

        relInfo = relationInfo[relationName];

        return function (item) {

            processItem = {
                keyFrom: relInfo.keyFrom,
                modelName: relInfo.modelName,
                relationName: relationName,
                data: item
            };

            if (item[relInfo.keyFrom]) {

                found.ready.push(processItem);

            } else {

                found.process.push(processItem);
            }
        };
    };

    for (var relationName in relationInfo) {

        rel = data[relationName];
        handleRelation = placeRelation(relationName);

        if (rel && relationInfo[relationName].multiple && rel instanceof Array) {

            rel.forEach(handleRelation);

        } else if (rel && rel instanceof Object) {

            handleRelation(rel);
        }
    }

    return found;
};

internals.Base.prototype._createRelation = function (relations, relation, done) {

    var Api = this.api,
        relName = relation.relationName,
        modelName = relation.modelName,
        apiMethod = Inflection.pluralize(modelName);

    var apiData = {
        payload: relation.data
    };

    Api[apiMethod].create(apiData, function (err, model) {

        // Convert model to JSON so it conforms with any
        // incoming data, which wouldn't be vivified.
        // Also store errors here...
        relation.data = err ? err : model.toJSON();
        relations.ready.push(relation);

        done();
    });
};

internals.Base.prototype._processRelations = function (relations, done) {

    if (relations.process.length === 0) {

        return done();
    }

    var self = this;

    Async.each(relations.process, function (relation, next) {

            self._createRelation(relations, relation, next);
        },
        function (err) {

            done(err);
        });
};

internals.Base.prototype._resetCachedRelations = function (model) {

    var relationInfo = this.getRelationInfo(model.constructor.modelName),
        relationNames = Object.keys(relationInfo);


    // TODO: Need to handle situation where cachedRelations are good /
    // needed, like when loading an existing model to update or add tags.

    relationNames.forEach(function (relName) {

        relInfo = relationInfo[relName];

        model.__cachedRelations[relName] = relInfo.multiple ? [] : {};
    });
};

internals.Base.prototype._addCachedRelations = function (model, relation, done) {

    var relData = relation.data,
        relName = relation.relationName;

    model[relName].add(relData, function (err) {

        if (model.__cachedRelations[relName] instanceof Array) {
            model.__cachedRelations[relName].push(relData);
        } else {
            model.__cachedRelations[relName] = relData;
        }

        done(err);
    });
};

internals.Base.prototype.processRelations = function (model, data, done) {

    var self = this;
    var relations = this._findRelations(model.constructor.modelName, data);

    if (!relations.ready.length && !relations.process.length) {

        return done();
    }

    this._resetCachedRelations(model);

    this._processRelations(relations, function (err) {

        // Ignore most relation errors, let them appear
        // in the return objects.

        Async.each(relations.ready, function (rel, next) {

            self._addCachedRelations(model, rel, next);

        }, function (err) {

            done(err);
        });
    });
};

internals.Base.prototype.keyExists = function (modelName, key, done) {

    var Models = this.models;

    var where = {
        key: key
    };

    Models[modelName].count(where, function (err, count) {
        done(err, err ? null : Boolean(count));
    });
};

internals.listParams = function (options) {

    var get = {
        order: 'createdAt',
        skip: 0,
        limit: 10
    };

    if (options.ids) {
        get.where = {};
        get.where.id = {};
        get.where.id.inq = options.ids.split(',');
    }

    if (options.order) {
        get.order = options.order;
    }

    if (options.sort) {
        get.order += ' ' + options.sort.toUpperCase();
    } else {
        get.order += ' DESC';
    }

    if (options.offset) {
        get.skip = +options.offset;
    }

    if (options.limit) {
        get.limit = +options.limit;
    }

    if (options.relations) {
        get.include = options.relations.split(',');
    }

    return get;
};

internals.readParams = function (options) {

    var get = {};

    var params = options.params;
    var query = options.query;

    if (params.id === 'bykey' && query.key) {

        // tag api accepts either UUIDs or keys
        get.method = 'findOne';
        get.params = {
            where: {
                key: query.key
            }
        };

    } else if (internals.isUUID(params.id)) {

        get.method = 'find';
        get.params = params.id;

    } else {

        get = null;
    }

    return get;
};

internals.isUUID = function (str) {

    var pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return pattern.test(str);
};

module.exports = function (root) {

    var expose;

    expose = new internals.Base(root);
    expose.listParams = internals.listParams;
    expose.readParams = internals.readParams;

    return expose;
};

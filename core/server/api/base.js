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
    Async.eachSeries(models, function (model, next) {

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

internals.Base.prototype._processRelations = function (relations, done) {

    var Api = this.api;

    if (relations.process.length === 0) {

        return done();
    }

    var relName,
        modelName,
        apiMethod,
        apiData;

    Async.eachSeries(relations.process, function (relation, next) {

            relName = relation.relationName;
            modelName = relation.modelName;
            apiMethod = Inflection.pluralize(modelName);
            apiData = {
                payload: relation.data
            };

            Api[apiMethod].create(apiData, function (err, model) {
                if (err) return next(err);

                // Convert model to JSON so it conforms with any
                // incoming data, which wouldn't be vivified.
                relation.data = model.toJSON();
                relations.ready.push(relation);

                next();
            });

        },

        function (err) {

            done(err);
        });
};

internals.Base.prototype._resetCachedRelations = function (model) {

    var relationInfo = this.getRelationInfo(model.constructor.modelName),
        relationNames = Object.keys(relationInfo);

    relationNames.forEach(function (relName) {

        relInfo = relationInfo[relName];

        model.__cachedRelations[relName] = relInfo.multiple ? [] : {};
    });
};

internals.Base.prototype.processRelations = function (model, data, done) {

    var relData,
        relId,
        relName;

    var relations = this._findRelations(model.constructor.modelName, data);

    if (!relations.ready.length && !relations.process.length) {

        return done();
    }

    this._resetCachedRelations(model);

    this._processRelations(relations, function (err) {

        Async.each(relations.ready, function (rel, next) {

            relData = rel.data;
            relName = rel.relationName;

            model[relName].add(relData, function (err) {

                if (model.__cachedRelations[relName] instanceof Array) {
                    model.__cachedRelations[relName].push(relData);
                } else {
                    model.__cachedRelations[relName] = relData;
                }

                next(err);
            });

        }, function (err) {

            done(err);
        });
    });
};

module.exports = function (root) {

    var base = new internals.Base(root);
    return base;
};

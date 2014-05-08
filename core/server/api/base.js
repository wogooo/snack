var Async = require('async');
var Inflection = require('inflection');
var Hapi = require('hapi');
var Hoek = require('hoek');

var internals = {};

internals.Base = function (options) {

    this.server = options.server;
    this.config = options.config;
    this.api = options.api;
    this.models = options.models;
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
            id: id,
            format: 'json'
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
        type: 'snack-app',
        data: {
            event: hook,
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

    if (item.dirty) {
        task.data.dirty = JSON.stringify(item.dirty);
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
            id: job.id,
            path: queuePath,
            start: self._startJob(job.id)
        };

        done(null, queued);
    });
};

internals.Base.prototype._enqueueItem = function (model, hook, next) {

    var destroyed = false;

    var queueItem = {
        type: model.type,
        id: model.id,
        cleanup: true
    };

    if (model.__data.dirty) {

        // Check private data for dirty fields
        queueItem.dirty = model.__data.dirty;
    }

    if (hook.search('.destroyed') > -1) {

        // When destroying, embed the model and no
        // cleanup required.
        queueItem.obj = model;
        queueItem.cleanup = false;
        destroyed = true;
    }

    this._enqueue(hook, queueItem, function (err, job) {

        if (err) return next(err);

        if (job && destroyed) {
            queued.start();
            return next();
        }

        // Job is queued, and in delayed state
        if (job) {

            // Place latest queue item at top, for easy reference
            model._queue_.unshift({
                id: job.id,
                path: job.path
            });

            // Persist to db
            model.save(function (err) {

                // Finally start the job
                job.start();
                next(err);
            });

            return;
        }

        next();
    });
};

internals.Base.prototype._enqueueArray = function (models, hook, done) {

    var self = this;

    Async.each(models, function (model, next) {

            self._enqueueItem(model, hook, next);
        },
        function (err) {

            done(err, models);
        });
};

internals.Base.prototype.enqueue = function (models, hook, done) {

    var Config = this.config,
        hooks = Config().hooks;

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

internals.Base.prototype._getRelationNames = function (modelName, showPrivate) {

    var relationInfo = this.getRelationInfo(modelName),
        relationNames = Object.keys(relationInfo);

    if (showPrivate) {
        return relationNames;
    }

    var filterPrivate = function (relName) {
        return !(relName[0] === '_' && relName[relName.length - 1] !== '_');
    };

    return relationNames.filter(filterPrivate);
};

internals.Base.prototype.loadRelations = function (model, relationNames, done) {

    var Models = this.models,
        modelName = model.constructor.modelName;

    if (!relationNames) {
        relationNames = this._getRelationNames(modelName);
    } else if (relationNames && !(relationNames instanceof Array)) {
        relationNames = relationNames.split(',');
    }

    Models[modelName].include([model], relationNames, function (err) {
        done(err);
    });
};

internals.Base.prototype._findRelations = function (model, payload) {

    payload = payload || {};

    var Api = this.api,
        Models = this.models;

    var found = {
        existing: [],
        create: []
    };

    var relationInfo = this.getRelationInfo(model.constructor.modelName),
        relationNames = Object.keys(relationInfo),
        relationName,
        cachedRelations = model.__cachedRelations,
        relByName,
        processItem,
        handleRelation;

    var uniqueRel = function (relationName, allRelations) {

        var relInfo = relationInfo[relationName];
        var unique = [];
        var seenAt = {};

        function uniqueRelations(currentValue, index) {

            if (currentValue && currentValue instanceof Object) {

                var key = currentValue[relInfo.keyFrom];

                // jugglingdb instances have no keys???
                var hasKeys = Boolean(Object.keys(currentValue).length);
                var isAlive = Boolean(currentValue.constructor && currentValue.constructor.modelName);
                var isRemove = Boolean(currentValue._remove_ === 'true' || currentValue._remove_ === true);

                if (isAlive || hasKeys) {

                    if (!key || typeof seenAt[key] === 'undefined') {
                        if (key) seenAt[key] = index;
                        this[index] = currentValue;
                    }

                    if ((isAlive || isRemove) && typeof seenAt[key] !== 'undefined') {

                        var seenAtIndex = seenAt[key];

                        // prefer living instances, but preserve if removing
                        if (isAlive && (this[seenAtIndex]._remove_ !== 'true' || this[seenAtIndex]._remove_ !== true)) {
                            this[seenAtIndex] = currentValue;
                        }

                        if (isRemove) {
                            this[seenAtIndex] = currentValue;
                        }
                    }
                }
            }
        }

        // Drop nulls
        allRelations.map(uniqueRelations, unique);
        return unique;
    };

    var placeRelation = function (relationName) {

        var relInfo = relationInfo[relationName];

        return function (item) {

            processItem = {
                keyFrom: relInfo.keyFrom,
                modelName: relInfo.modelName,
                relationName: relationName,
                remove: Boolean(item._remove_ === 'true' || item._remove_ === true),
                data: item
            };

            if (!item[relInfo.keyFrom] && processItem.remove !== true) {

                found.create.push(processItem);

            } else {

                found.existing.push(processItem);
            }
        };
    };

    var l = relationNames.length;
    var cR, pR;

    for (var i = 0; i < l; i++) {

        relationName = relationNames[i];

        // Can have relations as either objects or arrays of objects,
        // normalize to array of objects.
        cR = cachedRelations[relationName] || [];
        if (!(cR instanceof Array)) {
            cR = [cR];
        }

        pR = payload[relationName] || [];
        if (!(pR instanceof Array)) {
            pR = [pR];
        }

        relByName = cR.concat(pR);

        // Filter to remove possible dupes
        relByName = uniqueRel(relationName, relByName);

        handleRelation = placeRelation(relationName);

        if (relByName && relByName instanceof Array) {

            relByName.forEach(handleRelation);

        } else if (relByName && relByName instanceof Object) {

            handleRelation(relByName);
        }
    }

    return found;
};

internals.Base.prototype._createRelation = function (relations, relation, done) {

    var Api = this.api,
        relName = relation.relationName,
        modelName = relation.modelName,
        apiMethod = Inflection.pluralize(modelName).toLowerCase();

    var apiData = {
        payload: relation.data,
        query: {
            implicit: true
        }
    };

    Api[apiMethod].create(apiData, function (err, model) {

        // Err, or, new model
        if (err || model) {

            relation.data = err ? err : model;
            relations.existing.push(relation);
        }

        done();
    });
};

internals.Base.prototype._processRelations = function (relations, done) {

    if (relations.create.length === 0) {

        return done();
    }

    var self = this;

    Async.eachSeries(relations.create, function (relation, next) {

            self._createRelation(relations, relation, next);
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

internals.Base.prototype._updateCachedRelations = function (model, rel, done) {

    var relData = rel.data,
        relName = rel.relationName,
        relation = model[relName],
        method = (rel.remove === true) ? 'remove' : 'add';

    var pushRelation = function () {

        if (model.__cachedRelations[relName] instanceof Array) {
            model.__cachedRelations[relName].push(relData);
        } else {
            model.__cachedRelations[relName] = relData;
        }
    };

    if (relData instanceof Error) {

        // Present errored relations to user
        pushRelation();
        return done();
    }

    // TODO: this isn't quite right. belongsTo relations won't have
    // an add method, so the whole system for those needs to be
    // debugged...
    if (relation[method]) {

        relation[method](relData, function (err) {

            if (!rel.remove) {
                pushRelation();
            }
            done(err);
        });

    } else {

        pushRelation();
        done();
    }
};

internals.Base.prototype.processRelations = function (model, payload, done) {

    var self = this;
    var relations = this._findRelations(model, payload);

    if (!relations.create.length && !relations.existing.length) {

        return done();
    }

    this._resetCachedRelations(model);

    this._processRelations(relations, function (err) {

        // Ignore most relation errors, let them appear
        // in the return objects.

        Async.eachSeries(relations.existing, function (rel, next) {

            self._updateCachedRelations(model, rel, next);

        }, function (err) {

            done(err, model.__cachedRelations);
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

internals.Base.prototype.findUniqueKey = function (modelName, keyBase, keyExt, keyIncrement, done) {

    if (!keyBase) return done(Hapi.error.badImplementation('No base defined for key generation'));

    var self = this,
        retries = 10,
        key = '';

    key = keyBase;

    if (typeof keyIncrement === 'number') {
        key += '-' + keyIncrement;
        keyIncrement++;
    } else {
        keyIncrement = 0;
    }

    key += keyExt ? keyExt : '';

    this.keyExists(modelName, key, function (err, exists) {

        if (err) return done(err);

        if (exists && keyIncrement < retries) {

            // Try again...
            return self.findUniqueKey(modelName, keyBase, keyExt, keyIncrement, done);

        } else if (exists && keyIncrement >= retries) {

            // Retries exhausted
            return done(Hapi.error.badRequest('Could not generate a unique asset key'));

        } else {

            done(null, key);
        }
    });
};

internals.Base.prototype.listParams = function (options) {

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

    if (options.autocomplete) {

        // autocomplete
        get.where = {};
        get.where.key = new RegExp('^' + Hoek.escapeRegex(options.autocomplete) + '.*?', 'i');
    }

    if (options.filters && !get.where) {
        get.where = options.filters;
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
    } else if (options.modelName) {
        get.include = this._getRelationNames(options.modelName);
    }

    return get;
};

internals.Base.prototype.formatListParams = function (options) {

    var includes, include, inc, key;

    var get = {
        order: 'createdAt',
        offset: 0,
        limit: 10
    };

    if (options.ids) {
        get.where = {};
        get.where.id = {};
        get.where.id.in = options.ids.split(',');
    }

    if (options.autocomplete) {

        // Key for autocompletion
        key = options.key || 'key';

        // Autocomplete
        get.where = {};
        get.where[key] = new RegExp('^' + Hoek.escapeRegex(options.autocomplete) + '.*?', 'i');
    }

    if (options.filters instanceof Object && !get.where) {
        get.where = options.filters;
    }

    if (options.sort) {
        get.sort = options.sort.toLowerCase() === 'asc' ? 'asc' : 'desc';
    }

    if (options.order) {
        get.order = options.order;
    }

    if (options.offset) {
        get.offset = +options.offset;
    }

    if (options.limit) {
        get.limit = +options.limit;
    }

    if (options.include) {

        includes = options.include.split(',');
        get.include = {};

        for (var i in includes) {

            get.include[includes[i]] = true;

            // NOTE: Consider supporting nested includes, via serialization
            //       scheme similar to this:
            //       include=foo.bar.baz
            //       [ 'foo', 'bar', 'baz' ]
            //       { foo: { bar: { baz: true }}}
        }
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

    if (query.relations) {
        get.relations = query.relations.split(',');
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
    expose.readParams = internals.readParams;

    return expose;
};

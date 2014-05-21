var Path = require('path'),
    Hapi = require('hapi'),
    Promise = require('bluebird'),
    Hoek = require('hoek');

var Helpers = require('../helpers').models;

function Base() {}

Base.find = function (options) {

    options = options || {};

    var Model = this,
        where = options.where || {},
        orderBy = options.orderBy,
        sort = options.sort,
        include = options.include,
        total = Boolean(options.total),
        format = Boolean(options.format),
        query;

    query = processWhere(this, this, where);
    query = processOrder(this, query, orderBy, sort);
    query = processInclude(this, query, include);

    if (options.offset) {
        query = query.skip(options.offset);
    }

    if (options.limit) {
        query = query.limit(options.limit);
    }

    return query
        .run()
        .bind({})
        .then(function (results) {

            this.results = results;

            if (total) {
                total = processWhere(Model, Model, where);
                return total.count().execute();
            }
        })
        .then(function (total) {

            if (format) {
                return formatList(this.results, total, Model._name, options);
            } else {
                return this.results;
            }
        });
};

Base.findOne = function (opt) {

    var self = this,
        pk = this._pk,
        options = {};

    if (typeof opt === 'string') {

        options.where = {};
        options.where[pk] = opt;

    } else if (opt instanceof Object) {

        if (opt.through) {

            // Finding through another model. Return early.
            options = Hoek.clone(opt);
            delete options.through;

            return this.findThrough(opt.through, options);

        } else if (Object.keys(opt).length === 1 && !opt.where) {

            options.where = opt;

        } else {

            options = opt;
        }
    } else {

        return Promise.reject();
    }

    var where = options.where || {},
        orderBy = options.orderBy,
        sort = options.sort,
        include = options.include,
        query;

    query = processWhere(this, this, where);
    query = processOrder(this, query, orderBy, sort);
    query = processInclude(this, query, include);

    query = query.limit(1);

    return query
        .run()
        .then(function (results) {

            return results[0];
        });
};

Base.findThrough = function (through, options) {

    options = options || {};

    var self = this,
        joins = this._joins,
        j = Object.keys(through)[0],
        join = joins[j];

    if (join) {

        var rightKey = join.rightKey;
        var leftKey = join.leftKey;

        var where = {
            where: through[j],
            include: false
        };

        return join.model
            .findOne(where)
            .then(function (doc) {

                if (doc) {

                    options.where = {};
                    options.where[leftKey] = doc[rightKey];

                    return self.findOne(options);
                }
            });
    }
};

Base.create = function (data, options) {

    options = options || {};

    var Model = this,
        pk = Model._pk,
        joins = Model._joins,
        upsert = Boolean(options.upsert),
        relations = {};

    var hasRelations = Helpers.hasRelations(data, joins);

    if (hasRelations) {
        Helpers.gatherRelations(data, relations, joins);
    }

    var doc = new Model(data);

    // TODO: How to handle this sort of thing?
    if (data.password && doc.setPassword) {
        doc.setPassword(data.password);
    }

    // if (options.validate) {
    //     if (!doc.validate()) {
    //         return Promise.reject();
    //     }
    // }

    if (!hasRelations) {

        return doc.save()
            .catch(function (err) {

                if (err && err.message.search('Duplicate primary key') > -1) {
                    err.code = 409;
                    err.rejectedKey = doc[pk];
                }

                throw err;
            });

    } else {

        return doc.saveAll(hasRelations)
            .bind({})
            .then(function (doc) {

                this.doc = doc;

                if (Object.keys(relations).length > 0) {
                    return Helpers.enlivenRelations(relations, joins);
                }
            })
            .then(function (relations) {

                if (relations) {

                    this.doc = Hoek.merge(this.doc, relations);
                    return this.doc.saveAll(relations);

                } else {

                    return this.doc;
                }
            })
            .catch(function (err) {

                if (err && err.message.search('Duplicate primary key') > -1) {
                    err.code = 409;
                    err.rejectedKey = doc[pk];
                }

                throw err;
            });
    }
};

Base.update = function (data, options) {

    data = data || {};
    options = options || {};

    var Model = this,
        pk = Model._pk,
        joins = Model._joins,
        where = options.where,
        version = options.version,
        clearQueue = options.clearQueue,
        relations = {};

    var hasRelations = Helpers.hasRelations(data, joins);

    if (hasRelations) {
        Helpers.gatherRelations(data, relations, joins);
    }

    return Model.findOne(options)
        .bind({})
        .then(function (doc) {

            this.doc = doc;

            if (!doc) {

                // Throw if not found
                throw Hapi.error.notFound();
            }

            if (version && doc._version_ !== version) {

                // Throw if version (timestamp) doesn't match
                throw Hapi.error.conflict();
            }

            if (clearQueue && doc._queue_ instanceof Array) {

                // Clear a queue item
                data._queue_ = doc._queue_.filter(function (job) {
                    return (options.jobId !== job.id);
                });
            }

            // Merge incoming data
            doc.merge(data);

            if (Object.keys(relations).length > 0) {

                // Test for relations and if needed, vivify
                return Helpers.enlivenRelations(relations, joins);
            }
        })
        .then(function (relations) {

            if (relations) {

                this.doc = Hoek.merge(this.doc, relations);
                return this.doc.saveAll(relations);

            } else {

                return this.doc.save();
            }
        })
        .then(function (doc) {

            if (options.checkDirty && options.checkDirty instanceof Array) {

                var was = doc.getOldValue();
                var dirty = Helpers.checkDirty(options.checkDirty, doc, was);
                doc.setPrivate('dirty', dirty);
            }

            return doc;
        });
};

Base.destroy = function (options) {

    var Model = this,
        where = options.where;

    return Model
        .findOne(where)
        .then(function (doc) {

            if (!doc) throw Hapi.error.notFound();

            return doc.purge();
        });
};

Base.setPrivate = function (doc, key, val) {

    if (!doc.__data) {
        Object.defineProperty(doc, '__data', {
            enumerable: false,
            value: {}
        });
    }

    var privateData = {};

    if (key instanceof Object) {
        privateData = key;
    } else {
        privateData[key] = val;
    }

    for (var p in privateData) {
        doc.__data[p] = privateData[p];
    }
};

Base.prototype.setPrivate = function (key, val) {

    return Base.setPrivate(this, key, val);
};

Base.getPrivate = function (doc, key) {

    if (!key) {
        return doc.__data;
    } else {
        return doc.__data ? doc.__data[key] : null;
    }
};

Base.prototype.getPrivate = function (key) {

    return Base.getPrivate(this, key);
};

Base.getAlias = function (doc) {

    var aliases = doc.aliases,
        alias;

    if (aliases instanceof Array) {

        for (var a in aliases) {
            if (aliases[a].primary) {
                alias = aliases[a];
            }
        }

        alias = alias || aliases[0];
    }

    if (alias) {
        return alias.key;
    } else {
        return Helpers.generateSlug(doc.type, doc.id, '/');
    }
};

Base.prototype.getAlias = function () {

    return Base.getAlias(this);
};

Base.createAlias = function (doc, key, primary, auto) {

    var Model = doc.getModel();

    if (!Model._joins || !Model._joins.aliases) {
        return Promise.reject();
    }

    var Alias = Model._joins.aliases.model;

    return Alias
        .createUnique(key)
        .then(function (alias) {

            alias.primary = Boolean(primary);
            alias.auto = Boolean(auto);

            doc.add('aliases', alias);

            return doc.saveAll({
                aliases: true
            });
        });
};

Base.prototype.createAlias = function (key, primary) {

    var doc = this,
        auto = key ? true : false;

    console.log('auto alias?', auto);

    primary = (typeof primary === 'boolean') ? primary : true;

    key = key || Helpers.aliasForDoc(doc);

    return Base.createAlias(doc, key, primary, auto);
};

Base.prototype.replaceAlias = function () {

    var doc = this,
        key = Helpers.aliasForDoc(doc),
        primary = false,
        remove = [];

    var Model = doc.getModel();

    if (!Model._joins || !Model._joins.aliases) {
        return Promise.reject();
    }

    if (doc.aliases instanceof Array) {

        var aliases = [].concat(doc.aliases);
        var alias;

        for (var a in aliases) {

            alias = aliases[a];

            if (alias.auto && alias.key.search(key) < 0) {
                delete doc.aliases[a];
                remove.push(alias);
            }

            if (!primary && alias.primary) {
                primary = true;
            }
        }
    }

    if (remove.length) {

        doc.aliases = doc.aliases.filter(function () {
            return true;
        });

        var Alias = Model._joins.aliases.model;
        var args = [],
            pk = Alias._pk;

        for (var r in remove) {
            args.push(remove[r][pk]);
        }

        var query = Alias.getAll.apply(Alias, args);

        return query
            .delete()
            .run()
            .then(function () {
                return Base.createAlias(doc, key, primary, true);
            });

    } else {

        return Base
            .createAlias(doc, key, primary, true);
    }
};

Base.prototype.toJSON = function () {

    var doc = this,
        Model = doc.getModel(),
        out = {};

    for (var key in doc) {
        if (doc.hasOwnProperty(key)) {
            out[key] = doc[key];
        }
    }

    if (Model._propertyMap instanceof Object) {
        var mapped = Model.mapProperties(doc);
        out = Hoek.merge(out, mapped);
    }

    return out;
};

Base.prototype.add = function (relationName, addDoc) {

    var doc = this,
        Model = doc.getModel();

    if (!Model._joins && !Model._joins[relationName]) {
        return;
    }

    var relation = Model._joins[relationName];

    if (relation.type === 'hasMany' || relation.type === 'hasAndBelongsToMany') {
        doc[relationName] = doc[relationName] || [];
        doc[relationName].push(addDoc);
    }

    if (relation.type === 'hasOne' || relation.type === 'belongsTo') {
        doc[relationName] = addDoc;
    }

    return doc;
};

Base.mapProperties = function (doc) {

    var Model = this,
        map = Model._propertyMap || {},
        mapped = {},
        mappedProp;

    for (var key in map) {
        if (map[key] instanceof Function) {

            mappedProp = map[key].call(doc);

            if (mappedProp !== undefined) {
                mapped[key] = mappedProp;
            }
        }
    }

    return mapped;
};

function processWhere(Model, promise, where) {

    var pk = Model._pk,
        indexes = Model._indexes || {},
        model = Model._getModel(),
        r = model._thinky.r;

    indexes[pk] = true;

    var args, i, m, keys;
    var indexed = false;
    var queryParts = [];

    Object.keys(where).forEach(function (k) {

        var spec, cond = where[k];

        var allConds = [];

        if (cond && cond.constructor.name === 'Object') {
            keys = Object.keys(cond);
            for (i = 0, m = keys.length; i < m; i++) {
                allConds.push([keys[i], cond[keys[i]]]);
            }
        } else {
            allConds.push([false, cond]);
        }

        var hasIndex = Boolean(indexes[k] === true);

        for (i = 0, m = allConds.length; i < m; i++) {
            spec = allConds[i][0];
            cond = allConds[i][1];
            if (!spec) {
                if (cond instanceof RegExp) {
                    queryParts.push(r.row(k).match(toMatchExpr(cond)));
                } else if (!indexed && hasIndex) {
                    args = [cond];
                    args.push({
                        index: k
                    });
                    promise = promise.getAll.apply(promise, args);
                    indexed = true;
                } else {
                    queryParts.push(r.row(k).eq(cond));
                }
            } else {
                switch (spec) {
                case 'between':
                    if (!indexed && hasIndex) {
                        promise = promise.between(cond[0], cond[1], {
                            index: k
                        });
                        indexed = true;
                    } else {
                        queryParts.push(r.row(k).ge(cond[0]).and(r.row(k).le(cond[1])));
                    }
                    break;
                case 'inq':
                    if (!indexed && hasIndex) {
                        args = [].concat(cond);
                        args.push({
                            index: k
                        });
                        promise = promise.getAll.apply(promise, args);
                        indexed = true;
                    } else {
                        queryParts.push(r.expr(cond).contains(row(k)));
                    }
                    break;
                case 'nin':
                    queryParts.push(r.expr(cond).contains(r.row(k)).not());
                    break;
                case 'gt':
                    if (!indexed && hasIndex) {
                        promise = promise.between(cond, null, {
                            index: k,
                            left_bound: 'open'
                        });
                        indexed = true;
                    } else {
                        queryParts.push(r.row(k).gt(cond));
                    }
                    break;
                case 'gte':
                    if (!indexed && hasIndex) {
                        promise = promise.between(cond, null, {
                            index: k,
                            left_bound: 'closed'
                        });
                        indexed = true;
                    } else {
                        queryParts.push(r.row(k).ge(cond));
                    }
                    break;
                case 'lt':
                    if (!indexed && hasIndex) {
                        promise = promise.between(null, cond, {
                            index: k,
                            right_bound: 'open'
                        });
                        indexed = true;
                    } else {
                        queryParts.push(r.row(k).lt(cond));
                    }
                    break;
                case 'lte':
                    if (!indexed && hasIndex) {
                        promise = promise.between(null, cond, {
                            index: k,
                            right_bound: 'closed'
                        });
                        indexed = true;
                    } else {
                        queryParts.push(r.row(k).le(cond));
                    }
                    break;
                case 'neq':
                    queryParts.push(r.row(k).ne(cond));
                    break;
                }
            }
        }
    });

    var query;
    queryParts.forEach(function (comp) {
        if (!query) {
            query = comp;
        } else {
            query = query.and(comp);
        }
    });
    if (query) {
        promise = promise.filter(query);
    }

    return promise;
}

function processOrder(Model, query, orderBy, sort) {

    var model = Model._getModel(),
        r = model._thinky.r;

    if (orderBy && sort) {
        query = query.orderBy(r[sort](orderBy));
    } else if (orderBy) {
        query = query.orderBy(orderBy);
    }

    return query;
}

/*
    Everything: **
    First-level, Second, ...: *, *.*, *.*.*
    Named: roles, roles.*, *.roles
*/
function processInclude(Model, query, include) {

    if (!include) {
        return query;
    }

    if (include === '**') {
        return query.getJoin();
    }

    var joins;

    if (typeof include === 'string' && (
        include === '*' ||
        include.indexOf('*.*') > -1
    )) {

        var levels = include.split('.').length;
        joins = _includeJoins(Model, levels);
    }

    if (include &&
        include instanceof Object &&
        Object.keys(include).length > 0
    ) {

        joins = include;
    }

    return query.getJoin(joins);
}

function _includeJoins(Model, levels) {

    var lvls = levels - 1,
        joins = {},
        join;

    if (Model._joins) {
        for (var j in Model._joins) {
            if (Model._joins.hasOwnProperty(j)) {

                join = Model._joins[j];

                if (lvls) {
                    joins[j] = _includeJoins(join.model, lvls);
                } else {
                    joins[j] = true;
                }
            }
        }
    }

    return joins;
}

function toMatchExpr(regexp) {

    var expr = regexp.toString(),
        exprStop = expr.lastIndexOf('/'),
        exprCi = expr.slice(exprStop).search('i');

    expr = expr.slice(1, exprStop);

    if (exprCi > -1) {
        expr = '(?i)' + expr;
    }

    return expr;
}

function formatList(items, total, modelName, params) {

    var list = {};

    if (items && items instanceof Array) {
        list.items = items;
        list.count = items.length;
    }

    if (typeof total === 'number') {
        list.total = total;
    }

    if (modelName) {
        list.type = modelName.toLowerCase() + 'List';
    }

    if (params) {

        if (params.orderBy) {
            list.orderBy = params.orderBy;
        }

        if (params.sort) {
            list.sort = params.sort;
        }

        if (params.hasOwnProperty('offset')) {
            list.offset = params.offset;
        }

        if (params.hasOwnProperty('limit')) {
            list.limit = params.limit;
        }
    }

    return list;
}

module.exports = Base;

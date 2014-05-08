var Hapi = require('hapi'),
    Promise = require('bluebird'),
    Hoek = require('hoek');

var Helpers = require('../helpers').models;

function Base() {}

Base.find = function (options) {

    options = options || {};

    var self = this,
        where = options.where || {},
        orderBy = options.orderBy,
        sort = options.sort,
        include = !options.hasOwnProperty('include') ? '*' : options.include,
        total = Boolean(options.total),
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
                total = processWhere(self, self, where);
                return total.count().execute();
            }
        })
        .then(function (total) {

            return formatList(this.results, total, self._name, options);
        });
};

Base.findOne = function (opt) {

    var pk = this._pk,
        options = {};

    if (typeof opt === 'string') {

        options.where = {};
        options.where[pk] = opt;

    } else if (opt instanceof Object) {

        if (opt.through) {

            // Finding through another model. Return early.
            return this.findThrough(opt.through);

        } else {

            options = opt;
        }
    }

    var where = options.where || {},
        orderBy = options.orderBy,
        sort = options.sort,
        include = !options.hasOwnProperty('include') ? '*' : options.include,
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

Base.findThrough = function (through) {

    var self = this,
        joins = this._joins,
        j = Object.keys(through)[0],
        join = joins[j];

    if (join) {

        var key = join.rightKey;

        var where = {
            where: through[j],
            include: false
        };

        return join.model.findOne(where)
            .then(function (model) {
                if (model) {
                    return self.findOne(model[key]);
                }
            });
    }
};

Base.create = function (data) {

    var pk = this._pk,
        model = new this(data);

    return model.saveAll()
        .catch(function (err) {
            if (err && err.message.search('Duplicate primary key') > -1) {
                err.code = 409;
                err.rejectedKey = model[pk];
            }

            throw err;
        });
};

Base.update = function (data, options) {

    data = data || {};
    options = options || {};

    var pk = this._pk,
        where = options.where,
        version = options.version,
        clearQueue = options.clearQueue;

    if (where && where[pk]) {

        return this
            .findOne(where[pk])
            .then(function (model) {

                if (!model) throw Hapi.error.notFound();

                if (version && model._version_ !== version) {

                    // Throw if version (timestamp) doesn't match
                    throw Hapi.error.conflict();
                }

                if (clearQueue && model._queue_ instanceof Array) {

                    data._queue_ = model._queue_.filter(function (job) {
                        return !(options.jobId === job.id);
                    });
                }

                return model.merge(data).saveAll();
            })
            .then(function (model) {

                if (options.checkDirty && options.checkDirty instanceof Array) {
                    var was = model.getOldValue();
                    var dirty = Helpers.checkDirty(options.checkDirty, model, was);
                    model.setPrivate('dirty', dirty);
                }
                return model;
            });

    } else {

        return this.create(data);
    }
};

Base.destroy = function (options) {

    var where = options.where;

    return this.findOne(where)
        .then(function (model) {

            if (!model) throw Hapi.error.notFound();

            return model.purge();
        });
};

Base.prototype.setPrivate = function (key, val) {

    Object.defineProperty(this, '__' + key, {
        enumerable: false,
        value: val
    });
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

function processInclude(Model, query, include) {

    if (include === '*') {
        query = query.getJoin();
    }

    if (include &&
        include instanceof Object &&
        Object.keys(include).length > 0) {

        query = query.getJoin(include);
    }

    return query;
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

var Path = require('path'),
    Hoek = require('hoek'),
    Promise = require('bluebird'),
    Enqueue = require('./enqueue'),
    Common = require('../common');

for (var method in Common) {
    exports[method] = Common[method];
}

var internals = {};

internals.extendModel = function (target, source) {

    for (var key in source) {
        if (source.hasOwnProperty(key) && !target.hasOwnProperty(key)) {
            target[key] = source[key];
        }
    }

    for (var proto in source.prototype) {
        target.define(proto, source.prototype[proto]);
    }
};

exports.checkDirty = function (fields, data, was) {

    var dirty = {},
        field;

    for (var f in fields) {

        field = fields[f];

        dirty[field] = false;

        if (data[field] !== was[field]) {
            dirty[field] = true;
        }
    }

    return dirty;
};

exports.createModel = function (thinky, definition, Base) {

    var Model,
        indexes,
        indexName;

    Model = thinky.createModel(definition.name, definition.schema, definition.options);

    indexes = definition.indexes || {};

    if (indexes) {

        for (indexName in indexes) {
            Model.ensureIndex(indexName);
        }

        Model._indexes = indexes;
    }

    Model._propertyMap = definition.map || {};

    internals.extendModel(Model, Base);

    return Model;
};

exports.enqueue = function (server) {

    var options = {
        server: server
    };

    return new Enqueue(options);
};

exports.registerRelations = function (models, definition) {

    var name = definition.name,
        relations = definition.relations,
        Models = models,
        Model = Models[name];

    function register(rName, r) {

        Model[r.type](Models[r.model], rName, r.leftKey, r.rightKey);
    }

    var relation, relationName;

    for (relationName in relations) {

        register(relationName, relations[relationName]);
    }
};

/*
    Determine if an incoming relation is already existing,
    or will need to be created.
*/
internals.hasForeignKey = function (data, relation, join) {

    if (join.type === 'hasOne' || join.type === 'hasMany') {
        if (relation.hasOwnProperty(join.leftKey)) {
            return true;
        }
    }

    if (join.type === 'belongsTo') {
        if (relation.hasOwnProperty(join.rightKey)) {
            return true;
        }
    }

    if (join.type === 'hasAndBelongsToMany') {
        if (relation.hasOwnProperty(join.rightKey)) {
            return true;
        }
    }
};

/*
    Gather up any relation that cannot be created as part
    of a new doc's creation itself.
*/
exports.gatherRelations = function (data, relations, joins) {

    var relation,
        join,
        hasFK,
        relArr;

    for (var name in joins) {

        join = joins[name];
        relation = data[name];

        if (relation) {
            if (relation instanceof Array) {

                relArr = [];

                for (var r in relation) {

                    hasFK = internals.hasForeignKey(data, relation[r], join);
                    if (hasFK || relation[r].getModel) {
                        relArr.push(relation[r]);
                        delete data[name][r];
                    }
                }

                if (relArr.length > 0) {
                    relations[name] = relArr;

                    // Clean up the array
                    data[name] = data[name].filter(function() {
                        return true;
                    });

                    if (data[name].length === 0) {
                        delete data[name];
                    }
                }

            } else {

                hasFK = internals.hasForeignKey(data, relation, join);
                if (hasFK || data[name].getModel) {
                    relations[name] = data[name];
                    delete data[name];
                }
            }
        }
    }
};

exports.hasRelations = function (data, joins) {

    var defined = {},
        has = false;

    for (var name in joins) {

        if (data.hasOwnProperty(name) &&
            data[name] instanceof Object &&
            Object.keys(data[name]).length > 0) {

            has = true;
            defined[name] = true;
        }
    }

    return has ? defined : false;
};

/*
    Determine which relations have not already been vivified,
    and vivify them to allow saving.
*/
exports.enlivenRelations = function (relations, joins) {

    var name,
        relation,
        join,
        toFind = [],
        map = [],
        query,
        foreignKey,
        isArray = false;

    for (name in relations) {

        query = null;
        join = joins[name];
        relation = relations[name];
        isArray = Boolean(relation instanceof Array);

        if (isArray) {

            query = join.model;

            foreignKey = join.leftKey;
            var args = [];

            for (var r in relation) {

                rel = relation[r];

                if (!rel.getModel) {
                    rel.fetching = true;
                    args.push(rel[foreignKey]);
                }
            }

            if (args.length) {

                args.push({
                    index: foreignKey
                });

                query = query.getAll.apply(query, args);
            }

        } else {

            if (!relation.getModel) {

                if (join.type === 'belongsTo') {
                    foreignKey = join.rightKey;
                } else {
                    foreignKey = join.leftKey;
                }

                query = join.model.getAll(relation[foreignKey], {
                    index: foreignKey
                });
            }
        }

        if (query) {
            toFind.push(query.run());
        } else {
            toFind.push(Promise.resolve());
        }

        map.push({
            name: name,
            isArray: isArray
        });
    }

    return Promise
        .all(toFind)
        .then(function (results) {

            for (var i in results) {

                if (results.hasOwnProperty(i)) {

                    if (map[i].isArray) {

                        var relArray = relations[map[i].name];
                        var resArray = results[i];

                        for (var r in relArray) {

                            if (relArray[r].fetching) {
                                relations[map[i].name][r] = resArray.shift();
                            }
                        }

                    } else if (results[i] && results[i].length) {

                        relations[map[i].name] = results[i][0];
                    }
                }
            }

            return relations;
        });
};

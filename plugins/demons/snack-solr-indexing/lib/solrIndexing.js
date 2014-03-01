/* jshint sub:true */

var Request = require('request');
var Helios = require('helios');
var JSONbig = require('json-bigint');

var Maps = require('../maps');
var SolrDoc = require('./solrDoc');

var internals = {};

internals.SolrIndexing = function (demon, options) {

    options = options || {};

    this.config = demon.config;
    this.hapi = demon.hapi;

    this.queryBuilder = new Helios.queryBuilder();

    try {
        this.client = new Helios.client(options);
    } catch (e) {
        return null;
    }
};

internals.SolrIndexing.prototype.getMap = function (type) {

    type = type ? type.toLowerCase() : 'default';

    var map = {};

    if (Maps[type]) {

        map = Maps[type];

    } else if (Maps['default']) {

        map = Maps['default'];

    } else {

        map.id = 'id';
    }

    return map;
};

internals.SolrIndexing.prototype.mapValue = function (field, model) {

    var val;

    var mapped = {
        value: null,
        boost: null
    };

    if (typeof field === 'string') {

        mapped.value = model.hasOwnProperty(field) ? model[field] : null;
        return mapped;
    }

    if (field instanceof Array) {

        mapped.value = [];

        field.forEach(function (f) {
            if (model.hasOwnProperty(f)) {
                mapped.value.push(model[f]);
            }
        });

        mapped.value = mapped.value.length ? mapped.value : null;
        return mapped;
    }

    if (field instanceof Function) {

        val = field(model);
        mapped.value = val !== undefined ? val : null;
        return mapped;
    }

    if (field instanceof Object) {

        mapped.value = this.mapValue(field.value, model).value;
        mapped.boost = field.boost || 0;
        return mapped;
    }

    return mapped;
};

internals.SolrIndexing.prototype.applyMap = function (model, doc, existing) {

    var self = this;

    var map = this.getMap(model.type);
    var mappedKeys = Object.keys(map);
    var mapped;

    mappedKeys.forEach(function (key) {

        mapped = self.mapValue(map[key], model);

        if (mapped.value instanceof Array) {

            mapped.value.forEach(function (mValue) {
                doc.setField(key, mValue, mapped.boost);
            });

        } else {

            doc.setField(key, mapped.value, mapped.boost);
        }
    });

    if (existing) {

        // Clean the index if it has indexes we aren't mapping now
        var existingKeys = Object.keys(existing);
        existingKeys.forEach(function (key) {

            if (key === '_version_') return;

            if (mappedKeys.indexOf(key) === -1) {

                doc.setField(key, null);
            }
        });
    }
};

internals.SolrIndexing.prototype.toSolr = function (item, done) {

    var self = this;
    var client = this.client;
    var queryBuilder = this.queryBuilder;

    var query = queryBuilder.simpleQuery({
        q: 'id:' + item.id,
        rows: 1,
        wt: 'json'
    });

    client.select(query, function (err, res) {

        if (err) return done(err);

        var response;

        try {
            response = JSONbig.parse(res).response;
        } catch (e) {
            return done(e);
        }

        var exists = Boolean(response.numFound);

        var method = 'addDoc',
            version = 0,
            existing;

        var doc = new SolrDoc({
            update: exists
        });

        if (exists) {

            existing = response.docs[0];
            method = 'updateDoc';
            version = existing['_version_'];
        }

        // _version_ is special!
        doc.setField('_version_', version.toString());

        self.applyMap(item, doc, existing);

        client[method](doc.get(), true, function (err) {

            if (err) return done(err);

            done(err);
        });
    });
};

internals.SolrIndexing.prototype.fetchData = function (item, done) {

    var self = this;
    var config = this.config;

    var url = config.urlFor('api', {
        api: {
            type: item.type,
            id: item.id
        }
    }, true);

    Request.get(url, function (err, response, body) {

        if (err) return done(err);

        var data = JSON.parse(body);

        self.toSolr(data, done);
    });
};

internals.SolrIndexing.prototype.handler = function (job, done) {

    this.fetchData(job.data, done);
};

module.exports = internals.SolrIndexing;

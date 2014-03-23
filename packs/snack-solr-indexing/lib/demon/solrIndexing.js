/* jshint sub:true */

var Nipple = require('nipple');
var Helios = require('helios');
var HtmlStrip = require('htmlstrip-native').html_strip;

// JS loves long not. Solves some problems with _version_
var JSONbig = require('json-bigint');

var SolrDoc = require('./solrDoc');

var internals = {};

internals.SolrIndexing = function (demon, options) {

    options = options || {};

    var Utils = demon.hapi.utils;
    Utils.assert(options.solr, 'A solr configuration is required!');

    this.config = demon.config;
    this.hapi = demon.hapi;

    if (options.contentPath) {
        try {
            this.maps = require(options.contentPath).maps;
        } catch (e) {}
    }

    if (!this.maps) {
        this.maps = require('../examples');
    }

    this.queryBuilder = new Helios.queryBuilder();

    try {
        this.client = new Helios.client(options.solr);
    } catch (e) {
        return null;
    }
};

internals.SolrIndexing.prototype.ready = function (done) {

    this.client.select({
        q: '*:*',
        rows: 0
    }, function (err, results) {
        done(err);
    });
};

internals.SolrIndexing.prototype.getMap = function (type) {

    type = type ? type.toLowerCase() : 'default';

    var maps = this.maps;
    var map = {};

    if (maps[type]) {

        map = maps[type];

    } else if (maps['default']) {

        map = maps['default'];

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

        if (field.stripHtml) {

            var htmlStripOptions = { 'compact_whitespace': true };

            if (mapped.value && mapped.value.forEach) {

                mapped.value = mapped.value.map(function (v) {
                    return HtmlStrip(mapped.value, htmlStripOptions).trim();
                });

            } else if (mapped.value) {

                mapped.value = HtmlStrip(mapped.value, htmlStripOptions).trim();
            }
        }

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

    var config = this.config;

    var uri = config.urlFor('api', {
        api: {
            type: item.type,
            id: item.id
        }
    }, true);

    Nipple.get(uri, function (err, res, payload) {

        if (err) return done(err);

        var data = JSON.parse(payload);

        done(null, data);
    });
};

internals.SolrIndexing.prototype.handler = function (job, done) {

    var self = this;

    this.fetchData(job.data, function (err, data) {

        self.toSolr(data, done);
    });
};

module.exports = internals.SolrIndexing;

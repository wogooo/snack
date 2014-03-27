/*
    Relies on the solr indexes provided in this pack's
    demon to create a solr-powered search api
*/

// Sample incoming query:
//
// http://example.com/solr/search?q=cat+OR+dog+tags:pet+-tags:stray
//
// Apply searchParams map, like { 'tags': 'tags_txt', 'default': 'text' };
//
// > {
//        'default': [ { term: 'cat', op: 'AND' }, { term: 'dog', op: 'OR' } ],
//        'tags': [ { term: 'pet', op: 'AND' }, { term: 'stray', op: 'NOT' } ]
//   }
//
// > `NOT tags_txt:"stray" AND tags_txt:"pet" AND ("cat" OR "dog")`

var Helios = require('helios');
var Async = require('async');

var internals = {};

internals.Solr = function (options) {

    options = options || {};

    var plugin = options.plugin;
    var snack = options.server.app;

    this.server = options.server;
    this.snack = snack;
    this.config = snack.config;
    this.hapi = plugin.hapi;

    var Utils = this.hapi.utils;
    Utils.assert(options.solr, 'A solr configuration is required!');

    // TODO: Move to userspace...
    this.identityMap = {
        'id': 'id',
        'type': 'type_s'
    };

    this.searchParams = {
        'type': 'type_s',
        'site': 'site_s',
        'tags': 'tags_txt',
        'default': 'text'
    };

    try {
        this.client = new Helios.client(options.solr);
    } catch (e) {
        return null;
    }
};

internals.Solr.prototype.ready = function (done) {

    this.client.select({
        q: '*:*',
        rows: 0
    }, function (err, results) {
        done(err);
    });
};

internals.Solr.prototype.fetchData = function (item, done) {

    var Server = this.server;
    var Snack = this.snack;
    var Config = this.config;

    var url = Config.urlFor('api', {
        api: item
    });

    var req = {
        method: 'get',
        url: url
    };

    Server.inject(req, function (res) {
        var err = null;
        if (res.statusCode !== 200) {
            err = new Error('Bad response.');
        }

        done(err, res.result);
    });
};

internals.Solr.prototype.searchResponse = function (response, done) {

    var self = this;

    var map = this.identityMap;

    var docs = response.docs || [],
        idsByType = {},
        requestGroup = {},
        docOrder = [],
        tempItems = [],
        responseItems = [],
        types,
        currIndex;

    docs.forEach(function (doc) {

        idsByType[doc[map.type]] = idsByType[doc[map.type]] || [];
        idsByType[doc[map.type]].push(doc[map.id]);

        docOrder.push(doc[map.id]);
    });

    types = Object.keys(idsByType);

    var mapResponseItems = function (currVal) {

        currIndex = docOrder.indexOf(currVal.id);

        if (currIndex > -1) {
            this[currIndex] = currVal;
        }
    };

    Async.each(types, function (type, next) {

            requestGroup = {
                type: type,
                ids: idsByType[type]
            };

            self.fetchData(requestGroup, function (err, data) {
                if (err) return next(err);

                if (data && data.items) {
                    tempItems = tempItems.concat(data.items);
                }

                next();
            });
        },
        function (err) {
            if (err) return done(err);

            tempItems.map(mapResponseItems, responseItems);
            done(null, responseItems);
        });
};

internals.Solr.prototype.searchHandler = function (query, done) {

    var self = this;

    var params = this.searchParams;
    var map = this.identityMap;

    var client = this.client;

    var solrQuery = internals.toSolrQuery(query, params, map);

    client.select(solrQuery, function (err, res) {
        if (err) return done(err);

        var results = JSON.parse(res);
        var response = results.response;

        self.searchResponse(response, function (err, items) {
            if (err) return done(err);

            var searchList = internals.formatSearchList(response, items, query);
            done(null, searchList);
        });
    });
};

internals.formatSearchList = function (response, items, query) {

    var searchList = {
        type: 'searchList',
        offset: query.offset || 0,
        limit: query.limit || 10,
        total: response.numFound,
        count: items.length,
        items: items
    };

    return searchList;
};

internals.escapeString = function (str) {

    var specialChars = /([+|\-|&&|\|\||!|(|)|{|}|[|\]|^|"|~|*|?|:|\\])/g;

    return str.replace(specialChars, '\\$1');
};

internals.toQueryString = function (searchObj, params) {

    var searchParams = params;

    var query = '',
        phrase,
        phraseItem,
        clause,
        group;

    var searchKeys = Object.keys(searchObj);
    var searchKeysLength = searchKeys.length;

    if (searchKeysLength) {

        searchKeys.forEach(function (s, index) {

            phrase = searchObj[s];
            group = false;
            clause = '';

            phrase.forEach(function (phraseItem, p) {

                if (p === 0) {

                    if (phraseItem.op === 'NOT') {
                        clause += 'NOT ';
                    }

                } else {

                    if (phraseItem.op === 'OR') {
                        clause += 'OR ';
                        group = true;
                    } else if (phraseItem.op === 'NOT') {
                        clause += 'NOT ';
                    } else {
                        clause += 'AND ';
                    }
                }

                if (s !== 'default') {
                    clause += searchParams[s] + ':';
                }

                clause += '"' + phraseItem.term + '"';

                clause += ' ';
            });

            if (group) {

                query += ' (' + clause.trim() + ')';
                group = false;

            } else {

                query += ' ' + clause.trim();
            }

            if (index < (searchKeysLength - 1)) {

                query += ' AND';

            } else {

                query += ' ';
            }
        });

        query = query.trim();

    } else {

        query = '*:*';
    }

    return query;
};

internals.toSearchObject = function (str, params) {

    var searchParams = params;

    var searchObj = {},
        searchItem,
        searchParam,
        searchTerm;

    var escapeString = internals.escapeString;

    var words = str ? str.split(' ') : [];

    var wordParser = function (word, w) {

        for (var s in searchParams) {

            searchParam = new RegExp('^-?' + s + ':', 'i');

            if (word.search(searchParam) > -1) {

                searchObj[s] = searchObj[s] || [];

                searchItem = {
                    op: 'AND'
                };

                if (word.charAt(0) === '-') {

                    searchItem.op = 'NOT';
                    word = word.slice(1);

                } else if (words[w - 1] === 'OR') {

                    searchItem.op = 'OR';
                    delete words[w - 1];
                }

                searchTerm = word.replace(searchParam, '').replace('_', ' ');
                searchItem.term = escapeString(searchTerm);

                if (searchItem.op === 'OR') {

                    // Try to keep ORs toward the end of groups
                    searchObj[s].push(searchItem);

                } else {

                    searchObj[s].unshift(searchItem);
                }

                delete words[w];
            }
        }
    };

    words.forEach(wordParser);

    words = words.filter(function () {
        return true;
    });

    if (words.length) {

        searchObj['default'] = [];

        words.forEach(function (word, w) {

            if (word !== 'OR') {

                searchItem = {
                    op: 'AND'
                };

                if (word.charAt(0) === '-') {

                    searchItem.op = 'NOT';
                    word = word.slice(1);

                } else if (words[w - 1] === 'OR') {

                    searchItem.op = 'OR';
                }

                searchTerm = word.replace('_', ' ');
                searchItem.term = escapeString(searchTerm);

                searchObj['default'].push(searchItem);
            }
        });
    }

    return searchObj;
};

internals.toSolrQuery = function (query, params, map) {

    var searchObject = internals.toSearchObject(query.q, params);
    var queryString = internals.toQueryString(searchObject, params);

    var queryBuilder = new Helios.queryBuilder();

    var solrQuery = queryBuilder.simpleQuery({
        q: queryString,
        df: params['default'],
        rows: query.limit || 10,
        start: query.offset || 0,
        fl: [map.id, map.type].join(', ')
    });

    return solrQuery;
};

module.exports = internals.Solr;

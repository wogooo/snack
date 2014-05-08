var Hapi = require('hapi'),
    Hoek = require('hoek'),
    Promise = require('bluebird');

var internals = {};

internals._requestToList = function (request) {

    var params = request.params,
        query = request.query;

    var options = {
        total: true
    };

    var keys, key;

    if (query.keys || query.ids) {

        if (query.ids) {
            key = 'id';
            keys = query.ids.split(',');
        } else {
            key = query.key || 'id';
            keys = query.keys.split(',');
        }

        options.where = options.where || {};
        options.where[key] = {};
        options.where[key].inq = keys;
    }

    if (query.autocomplete) {

        // Key for autocompletion
        key = query.key || 'title';

        // Autocomplete
        options.where = options.where || {};
        options.where[key] = new RegExp('^' + Hoek.escapeRegex(query.autocomplete) + '.*?', 'i');
    }

    if (query.filters) {

        var filters, filter, flt;

        options.where = options.where || {};

        // EXAMPLE: ?filters=createdAt:gt:2014-04-04T
        filters = query.filters.split(',');
        for (var f in filters) {
            filter = filters[f];
            var flt = filter.split('|');
            if (flt.length === 2) {
                options.where[flt[0]] = flt[1];
            } else if (flt.length === 3) {
                options.where[flt[0]] = options.where[flt[0]] || {};
                options.where[flt[0]][flt[1]] = flt[2];
            }
        }
    }

    if (query.sort) {
        options.sort = query.sort.toLowerCase() === 'asc' ? 'asc' : 'desc';
    } else {
        options.sort = 'desc';
    }

    if (query.orderBy) {
        options.orderBy = query.orderBy;
    } else {
        options.orderBy = 'createdAt';
    }

    if (query.offset) {
        options.offset = +query.offset;
    } else {
        options.offset = 0;
    }

    if (query.limit) {
        options.limit = +query.limit;
    } else {
        options.limit = 10;
    }

    if (query.hasOwnProperty('include')) {

        var includes;

        if (query.include === 'false' || query.include === '0') {
            options.include = false;
        } else {
            includes = query.include.split(',');
            options.include = {};
            for (var i in includes) {
                options.include[includes[i]] = true;
            }
        }
    }

    return options;
};

internals._requestToRead = function (request) {

    var params = request.params,
        query = request.query;

    var options = {};

    if (params instanceof Object && Object.keys(params).length > 0) {

        var param, p;

        for (p in params) {

            param = params[p];

            if (p === 'id') {

                options.where = options.where || {};

                if (param === 'bykey' && query.key && query[query.key]) {

                    // EXAMPLE: api/v1/posts/bykey?key=path&path=foo/bar
                    options.where[query.key] = query[query.key];

                } else if (param === 'byalias' && query.alias) {

                    options.through = {};
                    options.through.aliases = {
                        id: query.alias
                    };

                } else {

                    options.where.id = param;
                }
            }
        }
    }

    if (query.hasOwnProperty('include')) {

        var includes;

        if (query.include === 'false' || query.include === '0') {
            options.include = false;
        } else {
            includes = query.include.split(',');
            options.include = {};
            for (var i in includes) {
                options.include[includes[i]] = true;
            }
        }
    }

    return options;
};

internals._requestToCreate = function (request) {

    var payload = request.payload,
        headers = request.headers;

    var options = {};

    options = internals._requestToRead(request);

    if (payload) {
        options.payload = payload;
    }

    return options;
};

internals._requestToEdit = function (request) {

    var payload = request.payload,
        headers = request.headers,
        query = request.query;

    var options = {};

    options = internals._requestToRead(request);

    if (payload) {
        options.payload = payload;
    }

    if (query.clearQueue) {
        options.clearQueue = true;
        options.jobId = parseInt(query.clearQueue, 10);
    }

    if (query.version) {
        options.version = version;
    }

    options.checkDirty = ['name', 'description'];

    return options;
};

internals._requestToRemove = function (request) {

    var query = request.query;

    var options = {};

    options = internals._requestToRead(request);

    if (query.destroy === 'true' || query.destroy === '1') {
        options.destroy = true;
    }

    return options;
};

internals._requestToStore = function (request) {

    var headers = request.headers,
        payload = request.payload;

    var options = {};

    options = internals._requestToRead(request);

    if (payload) {
        options.payload = payload;
    }

    if (headers) {
        if (headers['x-file-name']) {
            options.file = options.file || {};
            options.file.filename = headers['x-file-name'];
        }

        if (headers['x-file-size']) {
            options.file = options.file || {};
            options.file.bytes = headers['x-file-size'];
        }

        if (headers['content-type'] && options.file) {
            options.file.mimetype = headers['content-type'];
        }
    }

    return options;
};

/*
    Valid API methods here:
    list, read, create, edit, remove, store
*/

internals.requestHandler = function (method, request) {

    if (method === 'list') {
        return internals._requestToList(request);
    }

    if (method === 'read') {
        return internals._requestToRead(request);
    }

    if (method === 'create') {
        return internals._requestToCreate(request);
    }

    if (method === 'edit') {
        return internals._requestToEdit(request);
    }

    if (method === 'remove') {
        return internals._requestToRemove(request);
    }

    if (method === 'store') {
        return internals._requestToStore(request);
    }
};

module.exports = internals;

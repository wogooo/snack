var Path = require('path'),
    Hoek = require('hoek'),
    Crypto = require('crypto'),
    Bcrypt = require('bcrypt'),
    Uslug = require('uslug'),
    HtmlStrip = require('htmlstrip-native').html_strip,
    Inflection = require('inflection'),
    Mime = require('mime'),
    Moment = require('moment');

var Config = require('../../../shared/config');

var internals = {};

internals.applyTokens = function (str, tokens) {

    // replace tokens like {slug} or {year} with actual values
    str = str.replace(/({[a-z]+})/g, function (match) {
        var token = match.substr(1, match.length - 2);
        if (tokens.hasOwnProperty(token)) {
            return tokens[token]();
        }
    });

    return str;
};

internals.createAliasForFile = function (file, pattern) {

    var output = '',
        datetime = file.createdAt,
        tokens = {
            year: function () {
                return Moment(datetime).format('YYYY');
            },
            month: function () {
                return Moment(datetime).format('MM');
            },
            day: function () {
                return Moment(datetime).format('DD');
            },
            extension: function () {
                return Mime.extension(file.mimetype);
            },
            type: function () {
                return file.mimetype.split('/')[0];
            },
            subtype: function () {
                return file.mimetype.split('/')[1];
            },
            filename: function () {
                return file.filename.toLowerCase();
            },
            basename: function () {
                var ext = Path.extname(file.filename),
                    basename = Path.basename(file.filename, ext);

                return basename;
            }
        };

    output += pattern;

    return internals.applyTokens(output, tokens);
};

internals.createAliasForDoc = function (doc, pattern) {

    var output = '',
        datetime = doc.publishedAt || doc.createdAt,
        tokens = {
            year: function () {
                return Moment(datetime).format('YYYY');
            },
            month: function () {
                return Moment(datetime).format('MM');
            },
            day: function () {
                return Moment(datetime).format('DD');
            },
            type: function () {
                return doc.type;
            },
            kind: function () {
                return doc.kind || doc.type;
            },
            types: function () {
                return Inflection.pluralize(doc.type);
            },
            kinds: function () {
                return Inflection.pluralize(doc.kind || doc.type);
            },
            slug: function () {
                return Uslug(doc.slug || doc.title || doc.name);
            },
            id: function () {
                return doc.id;
            },
            shortid: function () {
                return doc.id.substr(0,8);
            },
            extension: function () {
                return doc.mimetype ? Mime.extension(doc.mimetype) : 'html';
            }
        };

    output += pattern;

    return internals.applyTokens(output, tokens);
};

internals.slugify = function (str) {

    str = HtmlStrip(str).trim();
    return Uslug(str);
};

/*
    Output a base64url (RFC 4648) encoded string
    when given a crypto-produced hash.
*/
internals.toBase64url = function (cryptoHash) {

    var base64string = cryptoHash.digest('base64');

    return (
        base64string
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
    );
};


exports.aliasForDoc = function (doc) {

    var collection = Inflection.pluralize(doc.type),
        permalinks = Config().permalinks,
        pattern;

    if (permalinks[collection]) {
        pattern = permalinks[collection];
    } else {
        pattern = permalinks['default'];
    }

    return internals.createAliasForDoc(doc, pattern);
};

exports.aliasForFile = function (file) {

    var collection = 'assets',
        permalinks = Config().permalinks,
        assetsRelPath = Config().paths.assetsRelPath,
        pattern;

    if (permalinks[collection]) {
        pattern = permalinks[collection];
    } else {
        pattern = permalinks['default'];
    }

    var alias = internals.createAliasForFile(file, pattern);

    return Path.join(assetsRelPath, alias);
};

exports.aliasToKey = function (alias, type) {

    if (type === 'asset') {
        var assetsRelPath = Config().paths.assetsRelPath;
        return alias.replace(assetsRelPath, '').replace(/^\//, '');
    }

    return alias;
};

exports.generateSlug = function ( /*[part1, [part2, [...]]], [separator]*/ ) {

    var length = arguments.length,
        len = length - 1,
        slugify = internals.slugify;

    if (length === 1) {

        return slugify(arguments[0]);

    } else if (length === 0) {

        return;
    }

    var parts = [],
        part,
        arg,
        separator;

    for (var a in arguments) {

        arg = arguments[a];

        if (a < len) {

            part = slugify(arg);
            parts.push(part);

        } else {

            separator = arg;
        }
    }

    return parts.join(separator || '');
};

exports.generateUrlHash = function (value) {

    var hash = Crypto.createHash('md5').update(value);
    return internals.toBase64url(hash);
};

exports.generateSecureHash = function (value, rounds) {

    return Bcrypt.hashSync(value, rounds || 12);
};

exports.compareSecureHash = function (value, hash) {

    return Bcrypt.compareSync(value, hash);
};

exports.generateRandomPassword = function (length) {

    var buffer = Crypto.randomBytes(length || 18);
    return buffer.toString('base64');
};

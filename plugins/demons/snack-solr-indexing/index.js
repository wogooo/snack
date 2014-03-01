module.exports = require('./lib');

var Request = require('request');
var Helios = require('helios');
var _ = require('lodash');

var internals = {};

internals.SearchIndexing = function (demon, options) {

    options = options || {};

    this.config = demon.config;
    this.hapi = demon.hapi;
    this.client = new Helios.client(options);
};

internals.SearchIndexing.prototype.handler = function (job, done) {

    var client = this.client;
    var config = this.config;

    var data = job.data;

    var apiUrl = config.urlFor('api', {
        api: {
            type: 'posts',
            id: data.id
        }
    }, true);



    function addToSolr(post) {

        var doc = new Helios.document();

        doc.setField('id', post.id);
        doc.setField('title_s', post.title);
        doc.setField('content_t', post.content);

        client.addDoc(doc, false, function (err) {

            console.log('done adding!', err);

            done(err);
        });
    }

    Request.get(apiUrl, function (err, response, body) {

        if (err) return done(err);

        var post = JSON.parse(body);

        addToSolr(post);
    });
};

exports.register = function (demon, options, next) {

    var searchIndexing = new internals.SearchIndexing(demon, options);

    demon.process({
        hook: 'post.updated',
        fn: function (job, done) {

            // THIS IS SUPER IMPORTANT!!!
            searchIndexing.handler(job, done);
        },
        options: {
            priority: 1
        }
    });

    demon.process({
        hook: 'post.created',
        fn: function (job, done) {

            // THIS IS SUPER IMPORTANT!!!
            searchIndexing.handler(job, done);
        },
        options: {
            priority: 1
        }
    });

    next();
};

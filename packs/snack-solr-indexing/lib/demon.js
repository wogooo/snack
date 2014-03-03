var SolrIndexing = require('./solrIndexing');

exports.register = function (demon, options, next) {

    var solrIndexing = new SolrIndexing(demon, options);

    if (!solrIndexing) {
        return next(new Error('Could not load Solr Indexing!'));
    }

    demon.process({
        hook: 'post.updated',
        fn: function (job, done) {
            solrIndexing.handler(job, done);
        },
        options: {
            priority: 1
        }
    });

    demon.process({
        hook: 'post.created',
        fn: function (job, done) {
            solrIndexing.handler(job, done);
        },
        options: {
            priority: 1
        }
    });

    next();
};

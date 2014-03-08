var SolrIndexing = require('./solrIndexing');

exports.register = function (demon, options, next) {

    var solrIndexing = new SolrIndexing(demon, options);

    if (!solrIndexing) {
        return next(new Error('Could not load Solr Indexing!'));
    }

    // Determine readyness before allowing this to register.
    solrIndexing.ready(function (err) {
        if (err) return next(err);

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
    });
};

var Solr = require('./solr');

module.exports = function (plugin, options, next) {

    options = options || {};

    var endpoint = options.endpoint || '/search';

    var selection = plugin.select('snack-app');

    var solr = new Solr({
        server: selection.servers[0],
        plugin: plugin,
        solr: options.solr,
        contentPath: options.contentPath
    });

    if (!solr) {
        plugin.log(['plugin', 'error'], 'SearchSolr registration error.', 'Failure to load solr client.');
        return next();
    }

    solr.ready(function (err) {

        if (err) {
            plugin.log(['plugin', 'error'], 'SearchSolr registration error.', err.message);
            return next();
        }

        plugin.route({
            method: 'GET',
            path: endpoint,
            handler: function (request, reply) {

                var query = request.query;

                solr.searchHandler(query, function (err, results) {

                    reply(results);
                });
            }
        });

        next();

    });

};

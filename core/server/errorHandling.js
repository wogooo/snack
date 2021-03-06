var Path = require('path'),
    Http = require('http'),
    Cluster = require('cluster'),
    Hapi = require('hapi'),
    Utils = require('hoek');

var internals = {};

internals.errorMismatch = function (error) {

    if (error.statusCode && error.output.statusCode && (error.statusCode !== error.output.statusCode)) {
        return true;
    }

    return false;
};

internals.respondWithJson = function (request) {

    var headers = request.headers || {},
        path = request.path,
        contentType = headers['content-type'] || '';

    if (contentType.search('application/json') > -1 ||
        contentType.search('application/x-www-form-urlencoded') > -1 ||
        path.search(/^\/api/) > -1) {

        return true;
    }
};

internals.responseHandler = function (server) {

    server.ext('onPreResponse', function (request, reply) {

        var response = request.response;

        if (!response.isBoom) {
            return reply();
        }

        var error = response;

        console.error("#red{%s}", error.message);
        console.debug(error.stack);

        if (internals.errorMismatch(error)) {

            // Boom unintelligently wraps any error in a 500.
            // Attempt to make that better.
            error.output.statusCode = error.statusCode;
            error.output.payload.statusCode = error.statusCode;
            error.output.payload.message = error.message;
            error.output.payload.error = Http.STATUS_CODES[error.statusCode];

            if (error.codes) {
                error.output.payload.codes = error.codes;
            }

            if (error.name) {
                error.output.payload.error = error.name;
            }
        }

        var respondWithJson = internals.respondWithJson(request);

        if (respondWithJson) {

            // Api paths can just return unrendered.
            return reply();
        }

        // Replace error with friendly HTML
        var defaults = {
            statusCode: 500,
            error: Http.STATUS_CODES[500],
            message: 'An error has occurred'
        };

        var context = Hoek.applyToDefaults(defaults, error.output.payload || {});

        if (context.statusCode === 404) {
            context.message = 'Page not found.';
            context.path = request.path;
        }

        reply.view('error', context, {
            engines: {
                html: 'handlebars'
            },
            path: Path.join(__dirname, './views'),
            partialsPath: Path.join(__dirname, './views/partials'),
            layout: false
        });
    });
};

internals.restartServer = function (server) {

    // Safely bring down the server and either restart, or
    // trigger a cluster disconnect.
    try {

        // make sure we close down within 30 seconds
        var killtimer = setTimeout(function () {
            process.exit(1);
        }, 30000);

        // But don't keep the process open just for that!
        killtimer.unref();

        // stop taking new requests.
        server.stop(function () {
            server.log(['error', 'serverStop']);
        });

        // Let the master know we're dead.  This will trigger a
        // 'disconnect' in the cluster master, and then it will fork
        // a new worker.
        if (Cluster.isWorker) {
            Cluster.worker.disconnect();
        } else {
            server.start(function () {
                server.log(['error', 'serverRestart']);
            });
        }
    } catch (er2) {

        // oh well, not much we can do at this point.
        console.error('Error sending 500!', er2.stack);
    }
};

internals.internalError = function (server) {

    // Handle internalError events, restart server if necessary
    server.on('internalError', function (request, err) {

        if (err.domainThrown) {
            internals.restartServer(server);
        }
    });
};

exports.init = function (server, next) {

    internals.internalError(server);
    internals.responseHandler(server);

    server.app.errorHandling = {
        restartServer: internals.restartServer
    };

    next();
};

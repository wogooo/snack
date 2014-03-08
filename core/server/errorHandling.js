var Cluster = require('cluster');

var internals = {};

internals.init = function (server, next) {

    // Safely bring down the server and either restart, or
    // trigger a cluster disconnect.
    server.on('internalError', function (request, err) {
        if (err.data.domainThrown) {
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
        }
    });

    next();
};

module.exports = internals;

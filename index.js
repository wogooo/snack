var Cluster = require('cluster');
var Snack = require('./core');

if (Cluster.isMaster) {

    // One worker for app, one for demon
    Cluster.fork({ SNACK_ENV: 'app'});
    Cluster.fork({ SNACK_ENV: 'demon'});

    // On disconnect notice, restart worker
    Cluster.on('disconnect', function (instance) {
        console.error('Worker ' + instance.id + ' died. Restarting.');
        Cluster.fork();
    });

} else {

    var SNACK_ENV = process.env.SNACK_ENV;

    var options = {
        SNACK_ENV: SNACK_ENV ? [ SNACK_ENV ] : []
    }

    Snack(options);
}

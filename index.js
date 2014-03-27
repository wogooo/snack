var Cluster = require('cluster');
var Minimist = require('minimist');
var argv = Minimist(process.argv.slice(2));

var Snack = require('./core');

if (Cluster.isMaster && !argv._.length) {

    // One worker for app, one for demon
    Cluster.fork({ SNACK_ENV: 'app'});
    Cluster.fork({ SNACK_ENV: 'demon'});

    // On disconnect notice, restart worker
    Cluster.on('disconnect', function (instance) {
        console.error('Worker ' + instance.id + ' died. Restarting.');
        Cluster.fork();
    });

} else {

    var SNACK_ENV;

    if (process.env.SNACK_ENV) {
        SNACK_ENV = [ process.env.SNACK_ENV ];
    } else if (argv._) {
        SNACK_ENV = argv._;
    }

    var options = {
        SNACK_ENV: SNACK_ENV || []
    }

    Snack(options);
}

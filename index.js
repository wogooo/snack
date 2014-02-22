var argv = require('minimist')(process.argv.slice(2));

var snack = require('./core');

snack({
    load: argv._
});

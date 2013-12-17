var Schema = require('jugglingdb').Schema;

var schema = new Schema('rethink', {
    host: 'localhost',
    port: 28015,
    database: 'test',
    poolMin: 1,
    poolMax: 10
});

exports.post = require('./post')(schema);

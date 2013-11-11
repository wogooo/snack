path = require('path');

module.exports = {
    cache: {
        engine: 'redis',
        host: 'localhost',
        port: 6379
    },
    security: {
        dbName: 'angular-app',
        usersCollection: 'users'
    },
    server: {
        host: '0.0.0.0',
        port: 8880,
        securePort: 8433,
        cluster: true,
        workerCount: 2,
        logLevel: 'debug'
        // distFolder: path.resolve(__dirname, '../client/dist'),
        // viewsFolder: path.resolve(__dirname, './views'),
        // staticUrl: '/static',
        // cookieSecret: 'angular-app'
    },
    auth: {
        twitter: {
            consumerKey: 'KlHvsciFtsBY2Z5f5bOseg',
            consumerSecret: 'xL7dPYRV0REi0EmftDJA4u63jL9S3sUCsg5e8vtjDU'
        },
        facebook: {
            clientID: '640979042578777',
            clientSecret: '9f5911ac5fade229c5c3f8a5d911b498'
        }
    },
    log: {
        level: 'debug'
    }
};

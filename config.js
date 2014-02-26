var path = require('path'),
    config;

config = {
    development: {

        url: 'http://localhost:8008',

        db: {
            engine: 'rethink',
            host: 'localhost',
            port: 28015,
            database: 'test',
            maxConnections: 10,
            minConnections: 2,
            connectionIdle: 30000,
            authKey: 'test'
        },
        queue: {
            kue: {
                host: 'localhost',
                port: 6379
            }
        },
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
            port: 8008,
            securePort: 8433
            // distFolder: path.resolve(__dirname, '../client/dist'),
            // viewsFolder: path.resolve(__dirname, './views'),
            // staticUrl: '/static',
            // cookieSecret: 'angular-app'
        },
        auth: {
            twitter: {
                consumerKey: 'xxx',
                consumerSecret: 'xxx'
            },
            facebook: {
                clientID: 'xxx',
                clientSecret: 'xxx'
            }
        },
        logging: {
            level: 'DEBUG'
        },
        demons: [
            'search-indexing',
            'open-calais'
        ]
    },

    production: {
        url: 'http://example.com',

        db: {
            engine: 'rethink',
            host: 'localhost',
            port: 28015,
            database: 'test',
            maxConnections: 10,
            minConnections: 2,
            connectionIdle: 30000,
            authKey: 'test'
        },
        queue: {
            kue: {
                host: 'localhost',
                port: 6379
            }
        },
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
            port: 8008,
            securePort: 8433,
            logLevel: 'debug'
            // distFolder: path.resolve(__dirname, '../client/dist'),
            // viewsFolder: path.resolve(__dirname, './views'),
            // staticUrl: '/static',
            // cookieSecret: 'angular-app'
        },
        auth: {
            twitter: {
                consumerKey: 'xxx',
                consumerSecret: 'xxx'
            },
            facebook: {
                clientID: 'xxx',
                clientSecret: 'xxx'
            }
        },
        logging: {
            level: 'DEBUG'
        }
    }
};

module.exports = config;

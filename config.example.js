var config;

config = {
    development: {
        'name': 'Snack',
        'url': 'http://localhost:8008',
        'paths': {
            assetsRelPathPattern: ':year/:month/:day/:filename'
        },
        'db': {
            engine: 'rethink',
            host: 'localhost',
            port: 28015,
            database: 'test',
            maxConnections: 10,
            minConnections: 2,
            connectionIdle: 30000,
            authKey: 'test'
        },
        'queue': {
            attempts: 3
        },
        'redis': {
            host: 'localhost',
            port: 6379
        },
        'server': {
            host: 'localhost',
            port: 8008,
            options: {
                payload: {
                    maxBytes: 20000000 // 20 MB
                }
            }
        },
        'logging': {
            level: 'DEBUG'
        },
        'auth': {
            'twitter': {
                consumerKey: 'xxx',
                consumerSecret: 'xxx'
            },
            'facebook': {
                clientID: 'xxx',
                clientSecret: 'xxx'
            }
        },
        'packs': {
            'demons': {
                'snack-solr-indexing': {
                    'solr': {
                        host: 'localhost',
                        port: 8983,
                        path: '/solr/test'
                    }
                }
            },
            'plugins': {
                'snack-solr-indexing': {
                    'endpoint': '/api/v1/search',
                    'solr': {
                        host: 'localhost',
                        port: 8983,
                        path: '/solr/test'
                    }
                }
            }
        }
    },

    production: {
        'name': 'Snack',
        'url': 'http://localhost:8008',
        'paths': {
            assetsRelPathPattern: ':year/:month/:day/:filename'
        },
        'db': {
            engine: 'rethink',
            host: 'localhost',
            port: 28015,
            database: 'test',
            maxConnections: 10,
            minConnections: 2,
            connectionIdle: 30000,
            authKey: 'test'
        },
        'queue': {
            attempts: 3
        },
        'redis': {
            host: 'localhost',
            port: 6379
        },
        'server': {
            host: 'localhost',
            port: 8008,
            options: {
                payload: {
                    maxBytes: 20000000 // 20 MB
                }
            }
        },
        'logging': {
            level: 'ERROR'
        },
        'auth': {
            'twitter': {
                consumerKey: 'xxx',
                consumerSecret: 'xxx'
            },
            'facebook': {
                clientID: 'xxx',
                clientSecret: 'xxx'
            }
        },
        'packs': {
            'demons': {
                'snack-solr-indexing': {
                    'solr': {
                        host: 'localhost',
                        port: 8983,
                        path: '/solr/test'
                    }
                }
            },
            'plugins': {
                'snack-solr-indexing': {
                    'endpoint': '/api/v1/search',
                    'solr': {
                        host: 'localhost',
                        port: 8983,
                        path: '/solr/test'
                    }
                }
            }
        }
    }
};

module.exports = config;

// Borrowed from Ghost!
//
// General entry point for all configuration data
//
// This file itself is a wrapper for the root level config.js file.
// All other files that need to reference config.js should use this file.

var Path = require('path'),
    Hapi = require('hapi'),
    Hoek = require('hoek'),
    Url = require('url'),
    ConfigUrl = require('./url'),
    appRoot = Path.resolve(__dirname, '../../../'),
    corePath = Path.resolve(appRoot, 'core/'),
    sharedLib = Path.resolve(corePath, 'shared/lib'),
    packageInfo = require(Path.resolve(appRoot, 'package.json')),
    snackConfig = {};

function updateConfig(config) {

    var localPath,
        contentPath,
        pluginsPath,
        subdir,
        logLevel,
        serverPort,
        serverHost,
        redisPort,
        redisHost,
        redisAuth;

    // Merge passed in config object onto
    // the cached snackConfig object
    snackConfig = Hoek.merge(snackConfig, config);

    // Protect against accessing a non-existant object.
    // This ensures there's always at least a paths object
    // because it's referenced in multiple places.
    snackConfig.paths = snackConfig.paths || {};

    // Parse local path location
    if (snackConfig.url) {
        localPath = Url.parse(snackConfig.url).path;
        // Remove trailing slash
        if (localPath !== '/') {
            localPath = localPath.replace(/\/$/, '');
        }
    }

    subdir = localPath === '/' ? '' : localPath;

    if (snackConfig.logging) {
        logLevel = snackConfig.logging.level ? snackConfig.logging.level.toUpperCase() : 'ERROR';
    }

    snackConfig.server = snackConfig.server || {};
    serverPort = process.env.PORT || snackConfig.server.port;
    serverHost = process.env.HOST || snackConfig.server.host;

    snackConfig.redis = snackConfig.redis || {};
    redisPort = process.env.REDIS_PORT || snackConfig.redis.port;
    redisHost = process.env.REDIS_HOST || snackConfig.redis.host;
    redisAuth = process.env.REDIS_AUTH || snackConfig.redis.password;

    // Allow contentPath to be over-written by passed in config object
    // Otherwise default to default content path location
    contentPath = snackConfig.paths.contentPath || Path.resolve(appRoot, 'content');
    packsPath = snackConfig.paths.packsPath || Path.resolve(appRoot, 'packs');

    snackConfig.packs = snackConfig.packs || {};
    snackConfig.packs.plugins = snackConfig.packs.plugins || {};
    snackConfig.packs.demons = snackConfig.packs.demons || {};

    snackConfig = Hoek.merge(snackConfig, {
        api: {
            'basePath': '/api',
            'version': 1
        },
        hooks: {
            'post.created': true,
            'post.updated': true,
            'post.deleted': true,
            'post.destroyed': true,
            'asset.created': true,
            'asset.updated': true,
            'asset.deleted': true,
            'asset.destroyed': true,
            'tag.created': false,
            'tag.updated': false,
            'tag.deleted': false,
            'tag.destroyed': false
        },
        server: {
            'port': serverPort,
            'host': serverHost,
            'options': {
                'cors': true,
                'files': {
                    'relativeTo': appRoot
                }
            }
        },
        redis: {
            'host': redisHost,
            'port': redisPort,
            'password': redisAuth
        },
        queue: {
            'basePath': '/api/v1',
            'attempts': 3,
            'host': serverHost,
            'port': 8181,
            'kue': {
                'disableSearch': true,
                'redis': {
                    'host': redisHost,
                    'port': redisPort,
                    'auth': redisAuth
                }
            }
        },
        logging: {
            'level': logLevel || 'ERROR'
        },
        paths: {
            'appRoot': appRoot,
            'subdir': subdir,
            'config': snackConfig.paths.config || Path.join(appRoot, 'config.js'),
            'configExample': Path.join(appRoot, 'config.example.js'),
            'corePath': corePath,
            'sharedLib': sharedLib,

            'contentPath': contentPath,
            'packsPath': packsPath,
            'themePath': Path.resolve(contentPath, 'themes'),
            'assetsPath': Path.resolve(contentPath, 'assets'),
            'assetsRelPath': '/content/assets',
            'assetsRelPathPattern': snackConfig.paths.assetsRelPathPattern || ':filename'

            // 'adminViews': path.join(corePath, '/server/views/'),
            // 'helperTemplates': path.join(corePath, '/server/helpers/tpl/'),
            // 'exportPath': path.join(corePath, '/server/data/export/'),
            // 'lang': path.join(corePath, '/shared/lang/'),
            // 'debugPath': subdir + '/ghost/debug/',

            // 'availableThemes': snackConfig.paths.availableThemes || [],
            // 'availableApps': snackConfig.paths.availableApps || [],
            // 'builtScriptPath': path.join(corePath, 'built/scripts/')
        }
    });

    snackConfig.packageInfo = packageInfo;

    ConfigUrl.setConfig(snackConfig);

    return snackConfig;
}

function initConfig(rawConfig) {
    // Cache the config.js object's environment
    // object so we can later refer to it.
    // Note: this is not the entirety of config.js,
    // just the object appropriate for this NODE_ENV
    snackConfig = updateConfig(rawConfig);

    return snackConfig;
}

// Returns NODE_ENV config object
function config() {

    if (Object.keys(snackConfig).length === 0) {
        initConfig({});
    }

    return snackConfig;
}

module.exports = config;
module.exports.init = initConfig;
module.exports.urlFor = ConfigUrl.urlFor;
// module.exports.urlForPost = ConfigUrl.urlForPost;
module.exports.keyForAsset = ConfigUrl.keyForAsset;

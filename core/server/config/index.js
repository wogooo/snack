// Borrowed from Ghost!
//
// General entry point for all configuration data
//
// This file itself is a wrapper for the root level config.js file.
// All other files that need to reference config.js should use this file.

var Path = require('path'),
    Hapi = require('hapi'),
    Utils = Hapi.utils,
    Url = require('url'),
    ConfigUrl     = require('./url'),
    appRoot = Path.resolve(__dirname, '../../../'),
    corePath = Path.resolve(appRoot, 'core/'),
    snackConfig = {};

function updateConfig(config) {

    var localPath,
        contentPath,
        pluginsPath,
        subdir,
        logLevel,
        serverPort,
        serverHost;

    // Merge passed in config object onto
    // the cached ghostConfig object
    snackConfig = Utils.merge(snackConfig, config);

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

    // Allow contentPath to be over-written by passed in config object
    // Otherwise default to default content path location
    contentPath = snackConfig.paths.contentPath || Path.resolve(appRoot, 'content');
    packsPath = snackConfig.paths.packsPath || Path.resolve(appRoot, 'packs');

    snackConfig = Utils.merge(snackConfig, {
        api: {
            'basePath': '/api',
            'version': 1
        },
        hooks: {
            'post.created': true,
            'post.updated': true,
            'post.deleted': true,
            'post.destroyed': true,
            'image.created': true,
            'image.updated': true,
            'image.deleted': true,
            'image.destroyed': true
        },
        server: {
            'port': serverPort,
            'host': serverHost
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

            'contentPath': contentPath,
            'packsPath': packsPath,
            // 'themePath': Path.resolve(contentPath, 'themes'),
            // 'appPath': Path.resolve(contentPath, 'apps'),
            'imagesPath': Path.resolve(contentPath, 'images'),
            'imagesRelPath': 'content/images',

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

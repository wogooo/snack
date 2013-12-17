var internals = {};

internals.ready = function (plugin, next) {

    console.log('consumer ready');

    var sample = plugin.plugins.sample;
    console.log(sample.events);
    sample.events.post.events.on('foo', function (msg) {
        console.log('message in consumer', msg);
    });

    next();
};

exports.register = function (plugin, options, next) {

    plugin.dependency('sample', internals.ready);

    console.log('consumer registered');

    next();
};

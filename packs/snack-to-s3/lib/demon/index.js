var SendToS3 = require('./sendToS3');

exports.register = function (demon, options, next) {

    var sendToS3 = new SendToS3(demon, options);

    sendToS3.ready(function (err) {
        if (err) return next(err);

        demon.process({
            hook: 'asset.created',
            fn: function (job, done) {
                sendToS3.handler(job, done);
            },
            options: {
                priority: 0
            }
        });

        demon.process({
            hook: 'asset.updated',
            fn: function (job, done) {
                sendToS3.handler(job, done);
            },
            options: {
                priority: 0
            }
        });

        demon.process({
            hook: 'asset.destroyed',
            fn: function (job, done) {
                sendToS3.handler(job, done);
            },
            options: {
                priority: 0
            }
        });

        next();
    });
};

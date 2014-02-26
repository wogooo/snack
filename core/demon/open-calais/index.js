var Request = require('request');

var config = {};

var internals = {};

internals.handler = function (job, done) {
    var data = job.data;
    var obj = {};

    var apiUrl = config.urlFor('api', {
        api: {
            model: 'posts',
            version: 1,
            id: data.id
        }
    }, true);

    Request.get(apiUrl, function (err, response, body) {

        var post = JSON.parse(body);

        obj.title = 'Diff. new title';

    });

    function seriouslyDone() {
        console.log('open calais seriouslyDone', obj);
        Request.put({
            url: apiUrl,
            form: obj
        }, function (err, response, body) {
            var results = JSON.parse(body);
            console.log('updated!', results);
        done();
        });
    }

    var pending = 5,
        total = pending;

    var interval = setInterval(function () {
        // job.progress(total - pending, total);
        --pending || seriouslyDone();
        pending || clearInterval(interval);
    }, 1000);
};

exports.register = function (demon, options, next) {

    config = demon.config;

    demon.process({
        hook: 'post.updated',
        fn: internals.handler,
        options: {
            priority: 1
        }
    });

    next();
};

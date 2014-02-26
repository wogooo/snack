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
        obj = JSON.parse(body);
        obj.title = 'New Title!';
    });

    function seriouslyDone() {
        console.log('search indexing seriouslyDone', obj);
        // Request.put({
        //     url: apiUrl,
        //     form: obj
        // }, function (err, response, body) {
        //     var results = JSON.parse(body);
        //     console.log('updated!', results);
        done();
        // });
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
            priority: 0
        }
    });

    // queue.process('image', function (job, done) {

    //     var data = job.data;
    //     var obj = {};

    //     var apiUrl = config.urlFor('api', {
    //         api: {
    //             model: 'posts',
    //             version: 1,
    //             id: data.id
    //         }
    //     }, true);

    //     Request.get(apiUrl, function (err, response, body) {
    //         obj = JSON.parse(body);
    //         obj.title = 'bloo blooo blam';
    //     });

    //     function seriouslyDone() {
    //         Request.put({ url: apiUrl, form: obj }, function (err, response, body) {
    //             var results = JSON.parse(body);
    //             console.log('updated!', results);
    //             done();
    //         });
    //     }

    //     var pending = 5,
    //         total = pending;

    //     var interval = setInterval(function () {
    //         job.progress(total - pending, total);
    //         --pending || seriouslyDone();
    //         pending || clearInterval(interval);
    //     }, 1000);
    // });

    next();
};

exports.register = function (workers, options, next) {

    var queue = workers.queue;
    var process = workers.process;

    process('image', function (api, job, done) {

        // var data = job.data;
        var results = {};

        api.get(function (error, response, body) {
            var data = JSON.parse(body);
            results = {
                sum: data.x + data.y
            };
        });

        var pending = 5,
            total = pending;

        var interval = setInterval(function () {
            job.progress(total - pending, total);
            --pending || done(null, results);
            pending || clearInterval(interval);
        }, 1000);
    });

    // queue.process('image', function (task, done) {
    //     done(null, task.data.x + task.data.y);
    // });

    // queue.process('image', function (job, done) {
    //     console.log('worker starting work');

    //     var pending = 5,
    //         total = pending;

    //     var interval = setInterval(function () {
    //         job.progress(total - pending, total);
    //         --pending || done();
    //         pending || clearInterval(interval);
    //     }, 1000);
    // });

    next();
};

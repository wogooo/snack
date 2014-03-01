var Request = require('request');

var internals = {};

internals.OpenCalais = function (options) {

    options = options || {};

    this.config = options.config;
};

internals.OpenCalais.prototype.handler = function (job, done) {

    console.log('opencalais handler');
    console.log(this.config);

    done();
    // var config = this.config;

    // var data = job.data;
    // var obj = {};

    // var apiUrl = config.urlFor('api', {
    //     api: {
    //         type: 'posts',
    //         id: data.id
    //     }
    // }, true);

    // Request.get(apiUrl, function (err, response, body) {

    //     var post = JSON.parse(body);

    // });

    // function complete() {

    //     Request.put({
    //         url: apiUrl,
    //         form: obj
    //     }, function (err, response, body) {

    //         var results = JSON.parse(body);
    //         done();
    //     });
    // }

    // var interval = setInterval(function () {
    //     complete();
    // }, 3000);
};

exports.register = function (demon, options, next) {

    var openCalais = new internals.OpenCalais(demon);

    // demon.process({
    //     hook: 'post.updated',
    //     fn: openCalais.handler,
    //     options: {
    //         priority: 1
    //     }
    // });

    next();
};

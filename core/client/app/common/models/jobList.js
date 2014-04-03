angular.module('models.jobList', ['ngResource'])

.factory('JobList', ['$resource',

    function ($resource, Job) {

        var apiUrl = '/api/v1/jobs';

        var defaultParams = {};

        return $resource(apiUrl, defaultParams);
    }
]);

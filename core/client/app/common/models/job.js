angular.module('models.job', ['ngResource'])

.factory('Job', ['$resource', '$q',

    function ($resource, $q) {

        var apiUrl = '/api/v1/jobs/:id';

        var defaultParams = {
            id: '@id'
        };

        var actions = {
            update: {
                method: 'PUT'
            }
        };

        return $resource(apiUrl, defaultParams, actions);
    }
]);

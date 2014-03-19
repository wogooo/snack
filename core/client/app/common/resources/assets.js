angular.module('resources.assets', ['ngResource'])

.factory('AssetsResource', ['$resource',
    function ($resource) {

        var defaultParams = {
            id: '@id'
        };

        var actions = {
            list: {
                method: 'GET'
            },
            find: {
                method: 'GET'
            },
            update: {
                method: 'PUT'
            }
        };

        return $resource('/api/v1/assets/:id.json', defaultParams, actions);
    }
]);

angular.module('models.tag', ['ngResource'])

.factory('Tag', ['$resource',

    function ($resource) {

        var apiUrl = '/api/v1/tags/:id.json';

        var defaultParams = {
            id: '@id'
        };

        var actions = {
            update: {
                method: 'PUT'
            }
        };

        var Tag = $resource(apiUrl, defaultParams, actions);

        return Tag;
    }
]);

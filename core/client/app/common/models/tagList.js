angular.module('models.tagList', ['ngResource', 'models.tag'])

.factory('TagList', ['$resource', 'Tag',

    function ($resource, Tag) {

        var apiUrl = '/api/v1/tags.json?autocomplete=:key';

        var defaultParams = {
            key: '@key'
        };

        var actions = {
            get: {
                method: 'GET',
                interceptor: {
                    response: function (response) {

                        var resource = response.resource;

                        // Vivify tags in list
                        for (var i = 0; i < resource.items.length; i++) {
                            resource.items[i] = new Tag(resource.items[i]);
                        }

                        return response;
                    },
                    responseError: function (response) {
                        console.log('interceptor err');
                    }
                }
            }
        };

        return $resource(apiUrl, defaultParams, actions);
    }
]);

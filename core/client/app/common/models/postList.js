angular.module('models.postList', ['ngResource', 'models.post'])

.factory('PostList', ['$resource', 'Post',

    function ($resource, Post) {

        var apiUrl = '/api/v1/posts.json';

        var defaultParams = {
            id: '@id'
        };

        var actions = {
            get: {
                method: 'GET',
                interceptor: {
                    response: function (response) {

                        var resource = response.resource;

                        // Vivify posts in list
                        for (var i = 0; i < resource.items.length; i++) {
                            resource.items[i] = new Post(resource.items[i]);
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

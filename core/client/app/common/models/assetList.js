angular.module('models.assetList', ['ngResource', 'models.asset'])

.factory('AssetList', ['$resource', 'Asset',

    function ($resource, Asset) {

        var apiUrl = '/api/v1/assets.json';

        var defaultParams = {};

        var actions = {
            get: {
                method: 'GET',
                interceptor: {
                    response: function (response) {

                        var resource = response.resource;

                        // Vivify posts in list
                        for (var i = 0; i < resource.items.length; i++) {
                            resource.items[i] = new Asset(resource.items[i]);
                        }

                        return response;
                    },
                    responseError: function (response) {
                        console.log('asset interceptor err');
                    }
                }
            }
        };

        return $resource(apiUrl, defaultParams, actions);
    }
]);

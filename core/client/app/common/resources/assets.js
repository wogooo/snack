angular.module('resources.assets', ['ur.file', 'ngResource'])

.factory('AssetsResource', ['$resource',

    function ($resource) {

        function AssetsResourceFactory($scope) {

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

            var AssetsResource = $resource('/api/v1/assets/:id.json', defaultParams, actions);
            var Files = $resource('/api/v1/files');

            if ($scope) {

                angular.extend($scope, {

                    asset: {},
                    file: {},

                    upload: function (file) {

                        // assetsResource.file = {
                        //     filename: file.name,
                        //     bytes: file.size,
                        //     mimetype: file.type
                        // };

                        // assetsResource.$save(function () {
                            Files.prototype.$save.call(file, function (self, headers) {
                                console.log(self, headers);
                            });
                        // });
                    }
                });
            }

            return AssetsResource;
        }

        return AssetsResourceFactory;
    }
]);

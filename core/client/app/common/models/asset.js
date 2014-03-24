angular.module('models.asset', ['ur.file', 'ngResource'])

.factory('Asset', ['$resource', '$q',

    function ($resource, $q) {

        var apiUrl = '/api/v1/assets/:id.json';

        var defaultParams = {
            id: '@id'
        };

        var actions = {
            update: {
                method: 'PUT'
            }
        };

        var Asset = $resource(apiUrl, defaultParams, actions);
        var Files = $resource('/api/v1/files');

        Asset.prototype.$upload = function (upload) {

            var asset = this;
            var deferred = $q.defer();

            // TODO: custom upload XHR, so I can get progress into the upload
            // scope.

            Files.prototype.$save.call(upload.file, function (self, headers) {

                angular.extend(asset, self);
                deferred.resolve();
            });

            return deferred.promise;
        };

        return Asset;
    }
]);

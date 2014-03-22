angular.module('models.post', ['ngResource', 'models.asset'])

.factory('Post', ['$resource', '$q', 'Asset',

    function ($resource, $q, Asset) {

        var apiUrl = '/api/v1/posts/:id.json';

        var defaultParams = {
            id: '@id'
        };

        var actions = {
            update: {
                method: 'PUT',
                interceptor: {
                    response: function (response) {

                        var resource = response.resource;

                        // Vivify assets in post
                        for (var i = 0; i < resource.assets.length; i++) {
                            resource.assets[i] = new Asset(resource.assets[i]);
                        }

                        return response;
                    },
                    responseError: function (response) {
                        console.log('interceptor err');
                    }
                }
            },
            get: {
                method: 'GET',
                interceptor: {
                    response: function (response) {

                        var resource = response.resource;

                        // Vivify assets in post
                        for (var i = 0; i < resource.assets.length; i++) {
                            resource.assets[i] = new Asset(resource.assets[i]);
                        }

                        return response;
                    },
                    responseError: function (response) {
                        console.log('interceptor err');
                    }
                }
            }
        };

        var Post = $resource(apiUrl, defaultParams, actions);

        Post.prototype.$createAsset = function (file) {

            var post = this;
            var asset = new Asset();
            var deferred = $q.defer();

            post.assets = post.assets || [];

            asset.$upload(file).then(function () {

                // Bring the asset into the post.
                post.assets.push(asset);

                if (post.id) {

                    // Persist the association.
                    post.$update();
                }

                deferred.resolve();
            });

            return deferred.promise;
        };

        return Post;
    }
]);

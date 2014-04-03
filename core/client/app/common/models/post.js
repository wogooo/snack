angular.module('models.post', ['ngResource', 'models.asset', 'models.tag'])

.factory('Post', ['$resource', '$q', 'Asset', 'Tag',

    function ($resource, $q, Asset, Tag) {

        var apiUrl = '/api/v1/posts/:id.json';

        var defaultParams = {
            id: '@id'
        };

        var enliven = function (response) {
            var resource = response.resource;

            // Vivify assets in post
            for (var a = 0; a < resource.assets.length; a++) {
                resource.assets[a] = new Asset(resource.assets[a]);
            }

            for (var t = 0; t < resource.tags.length; t++) {
                resource.tags[t] = new Tag(resource.tags[t]);
            }

            return response;
        };

        var actions = {
            update: {
                method: 'PUT',
                interceptor: {
                    response: function (response) {

                        return enliven(response);
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

                        return enliven(response);
                    },
                    responseError: function (response) {

                        console.log('interceptor err');
                    }
                }
            },
            create: {
                method: 'POST'
            }
        };

        var Post = $resource(apiUrl, defaultParams, actions);

        Post.prototype.$save = function (params, successcb) {
            if (this.id) {
                this.$update(params, successcb);
            } else {
                this.$create(params, successcb);
            }
        };

        Post.prototype.$createAsset = function (data) {

            var post = this;
            var asset = new Asset();
            var deferred = $q.defer();

            post.assets = post.assets || [];

            asset.$upload(data).then(function () {

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

        Post.prototype.$updateTag = function (data) {

            var post = this;

            data.posts = [{
                id: post.id
            }];

            var deferred = $q.defer();

            post.tags = post.tags || [];

            if (data.id) {

                var tag = data;
                tag.$update(function () {
                    post.tags.push(tag);
                    deferred.resolve();
                });

            } else {

                var tag = new Tag(data);
                tag.$save(function () {
                    post.tags.push(tag);
                    deferred.resolve();
                });
            }

            return deferred.promise;
        };

        Post.prototype.$removeTag = function (tag) {

            var post = this;

            tag.posts = [{
                id: post.id,
                _remove_: true
            }];

            var deferred = $q.defer();

            tag.$update(function () {
                angular.forEach(post.tags, function (postTag, tagIndex) {
                    if (postTag.id === tag.id) {
                        post.tags.splice(tagIndex, 1);
                    }
                });

                deferred.resolve();
            });

            return deferred.promise;
        };


        return Post;
    }
]);

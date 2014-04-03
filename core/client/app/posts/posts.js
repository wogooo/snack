angular.module('posts', ['ui.bootstrap', 'resources.posts', 'resources.assets', 'resources.tags', 'textAngular'])

.config(['$routeProvider',
    function ($routeProvider) {
        $routeProvider.when('/posts/create', {
            templateUrl: 'posts/posts-edit.tpl.html',
            controller: 'PostsEditCtrl',
            resolve: {
                post: ['PostsResource',
                    function (PostsResource) {
                        var post = new PostsResource({
                            type: 'post'
                        });

                        return post.$save({ pending: true });
                    }
                ]
            }
        });

        $routeProvider.when('/posts/:id/edit', {
            templateUrl: 'posts/posts-edit.tpl.html',
            controller: 'PostsEditCtrl',
            resolve: {
                post: ['$route', 'PostsResource',
                    function ($route, PostsResource) {
                        return PostsResource.find({
                            id: $route.current.params.id
                        });
                    }
                ]
            }
        });

        $routeProvider.when('/posts', {
            templateUrl: 'posts/posts-list.tpl.html',
            controller: 'PostsListCtrl',
            resolve: {
                postList: ['PostsResource',
                    function (PostsResource) {
                        return PostsResource.list();
                    }
                ]
            }
        });
    }
])

.controller('PostsListCtrl', ['$scope', '$location', 'postList',
    function ($scope, $location, postList) {

        $scope.postList = postList;

        $scope.editPost = function (post) {
            $location.path('/posts/' + post.id + '/edit');
        };

        $scope.newPost = function (post) {
            $location.path('/posts/create');
        };
    }
])

.controller('PostsEditCtrl', ['$scope', '$modal', '$routeParams', '$location', 'i18nNotifications', 'TagsResource', 'post',
    function ($scope, $modal, $routeParams, $location, i18nNotifications, TagsResource, post) {

        $scope.post = post;

        var onSave = function () {
            i18nNotifications.pushForNextRoute('crud.post.save.success', 'success', {
                title: post.title
            });

            $location.path('/posts');
        };

        $scope.save = function () {

            // Necessary right now because of textAngular behavior
            var pRegex = /^<p>(.*?)<\/p>$/;
            if (post.headline.search(pRegex) > -1) {
                post.headline = pRegex.exec(post.headline)[1];
            }

            post.$save({ finalize: true }, onSave);
        };

        $scope.remove = function () {
            post.$remove(function () {
                $location.path('/posts');
            });
        };

        $scope.upload = {};

        $scope.createAsset = function (upload) {
            post.$createAsset(upload).then(function () {
                $scope.upload = {};
            });
        };

        $scope.editAsset = function (asset) {

            var modalInstance = $modal.open({
                templateUrl: 'assets/assets-edit.tpl.html',
                controller: 'AssetsEditCtrl',
                resolve: {
                    asset: function () {
                        return asset;
                    }
                }
            });
        };

        $scope.selectedTag = undefined;

        $scope.tagsAutocomplete = function (val) {

            var q = {
                key: 'tag/' + val
            };

            return TagsResource.list(q)
                .$promise
                .then(function (response) {
                    var data = response.data;
                    var tags = [];
                    angular.forEach(data.items, function (item) {
                        tags.push(item);
                    });
                    return tags;
                });
        };

        $scope.addTag = function (tag) {
            post.$updateTag(tag)
                .then(function () {
                    $scope.selectedTag = undefined;
                });
        };

        $scope.removeTag = function (tag) {
            post.$removeTag(tag);
        };
    }
]);

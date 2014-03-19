angular.module('posts', ['resources.posts'])

.config(['$routeProvider',
    function ($routeProvider) {
        $routeProvider.when('/posts/create', {
            templateUrl: 'posts/posts-edit.tpl.html',
            controller: 'PostsEditCtrl',
            resolve: {
                post: ['PostsResource',
                    function (PostsResource) {
                        return new PostsResource;
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

.controller('PostsEditCtrl', ['$scope', '$routeParams', '$location', 'i18nNotifications', 'post',
    function ($scope, $routeParams, $location, i18nNotifications, post) {

        $scope.post = post;

        var onSave = function () {
            i18nNotifications.pushForNextRoute('crud.post.save.success', 'success', {
                title: post.title
            });

            $location.path('/posts');
        };

        $scope.save = function () {
            if (post.id) {
                post.$update(onSave);
            } else {
                post.$save(onSave);
            }
        };

        $scope.remove = function () {
            post.$remove(function () {
                $location.path('/posts');
            });
        };

        // $scope.onError = function () {
        //     i18nNotifications.pushForCurrentRoute('crud.user.save.error', 'error');
        // };

        // $scope.onRemove = function (user) {
        //     i18nNotifications.pushForNextRoute('crud.user.remove.success', 'success', {
        //         id: user.$id()
        //     });
        //     $location.path('/admin/users');
        // };

    }
]);

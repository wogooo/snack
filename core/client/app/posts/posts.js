angular.module('posts', ['resources.posts', 'resources.assets', 'textAngular'])

.config(['$routeProvider',
    function ($routeProvider) {
        $routeProvider.when('/posts/create', {
            templateUrl: 'posts/posts-edit.tpl.html',
            controller: 'PostsEditCtrl',
            resolve: {
                post: ['PostsResource',
                    function (PostsResource) {
                        return new PostsResource({ type: 'post' });
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

.controller('PostsEditCtrl', ['$scope', '$modal', '$routeParams', '$location', 'i18nNotifications', 'post',
    function ($scope, $modal, $routeParams, $location, i18nNotifications, post) {

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

        $scope.file = {};

        $scope.createAsset = function (file) {
            post.$createAsset(file).then(function () {
                $scope.file = {};
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

            // modalInstance.result.then(function (selectedItem) {
            //     $scope.selected = selectedItem;
            // }, function () {
            //     $log.info('Modal dismissed at: ' + new Date());
            // });
        };

        // var uploader = $fileUploader.create({
        //     scope: $scope,
        //     url: '/api/v1/assets',
        //     formData: [{
        //         title: 'test uploader'
        //     }],
        //     filters: [

        //         function (item) {
        //             console.info('filter1', item);
        //             return true;
        //         }
        //     ]
        // });

        // $scope.uploader = uploader;

        // uploader.bind('afteraddingfile', function (event, item) {
        //     console.info('After adding a file', item);
        // });

        // uploader.bind('whenaddingfilefailed', function (event, item) {
        //     console.info('When adding a file failed', item);
        // });

        // uploader.bind('afteraddingall', function (event, items) {
        //     console.info('After adding all files', items);
        // });

        // uploader.bind('beforeupload', function (event, item) {
        //     console.info('Before upload', item);
        // });

        // uploader.bind('progress', function (event, item, progress) {
        //     console.info('Progress: ' + progress, item);
        // });

        // uploader.bind('success', function (event, xhr, item, response) {
        //     console.info('Success', xhr, item, response);
        // });

        // uploader.bind('cancel', function (event, xhr, item) {
        //     console.info('Cancel', xhr, item);
        // });

        // uploader.bind('error', function (event, xhr, item, response) {
        //     console.info('Error', xhr, item, response);
        // });

        // uploader.bind('complete', function (event, xhr, item, response) {
        //     console.info('Complete', xhr, item, response);
        // });

        // uploader.bind('progressall', function (event, progress) {
        //     console.info('Total progress: ' + progress);
        // });

        // uploader.bind('completeall', function (event, items) {
        //     console.info('Complete all', items);
        // });
    }
]);

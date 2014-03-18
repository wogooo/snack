angular.module('dashboard', ['resources.posts'])

.config(['$routeProvider',
    function ($routeProvider) {
        $routeProvider.when('/dashboard', {
            templateUrl: 'dashboard/dashboard.tpl.html',
            controller: 'DashboardCtrl',
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

.controller('DashboardCtrl', ['$scope', '$location', 'postList',
    function ($scope, $location, postList) {

        $scope.postList = postList;

        $scope.editPost = function (post) {
            $location.path('/posts/' + post.id + '/edit');
        };

    }
]);

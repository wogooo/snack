angular.module('dashboard', ['resources.posts'])
  .config(['$routeProvider',
    function ($routeProvider) {
      $routeProvider.when('/dashboard', {
        templateUrl: 'dashboard/dashboard.tpl.html',
        controller: 'DashboardCtrl',
        resolve: {
          posts: ['Posts',
            function (Posts) {
              return Posts.all();
            }
          ]
        }
      });
    }
  ])
  .controller('DashboardCtrl', ['$scope', '$location', 'posts',
    function ($scope, $location, posts) {
      $scope.posts = posts;
    }
  ]);

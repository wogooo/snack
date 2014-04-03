angular.module('app', [
    'ui.bootstrap',
    'ngRoute',
    'ngResource',
    'ngSanitize',
    'dashboard',
    'posts',
    'assets',
    'jobs',
    'security',
    'services.i18nNotifications',
    'services.localizedMessages',
    'templates.app'
])

.config(['$routeProvider', '$locationProvider',
    function ($routeProvider, $locationProvider) {
        $locationProvider.html5Mode(true);
        $routeProvider.otherwise({
            redirectTo: '/dashboard'
        });
    }
])

.run(['security', '$rootScope', '$location',
    function (security, $rootScope, $location) {

        // Get the current user when the application starts
        // (in case they are still logged in from a previous session)
        security.requestCurrentUser();
    }
])

.controller('AppCtrl', ['$scope', 'i18nNotifications', 'localizedMessages',
    function ($scope, i18nNotifications) {

        $scope.notifications = i18nNotifications;

        $scope.removeNotification = function (notification) {
            i18nNotifications.remove(notification);
        };

        $scope.$on('$routeChangeError', function (event, current, previous, rejection) {
            i18nNotifications.pushForCurrentRoute('errors.route.changeError', 'error', {}, {
                rejection: rejection
            });
        });
    }
])

.controller('HeaderCtrl', ['$scope', '$location', '$route', 'notifications', 'security',
    function ($scope, $location, $route, notifications, security) {

        $scope.location = $location;
        // $scope.breadcrumbs = breadcrumbs;

        $scope.isAuthenticated = security.isAuthenticated;
        $scope.isAdmin = security.isAdmin;

        $scope.home = function () {
            if (security.isAuthenticated()) {
                $location.path('/dashboard');
            }

            // if (security.isAuthenticated()) {
            //     $location.path('/dashboard');
            // } else {
            //     $location.path('/projectsinfo');
            // }
        };

        $scope.isNavbarActive = function (navBarPath) {
            return true;
            // return navBarPath === breadcrumbs.getFirst().name;
        };

        $scope.hasPendingRequests = function () {
            return false;
            // return httpRequestTracker.hasPendingRequests();
        };
    }
]);

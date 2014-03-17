angular.module('app', [
    'ui.bootstrap',
    'ngRoute',
    'ngResource',
    'ngSanitize',
    'dashboard',
    'services.i18nNotifications',
    'services.localizedMessages',
    'templates.app',
    'templates.common'
]);

angular.module('app').config(['$routeProvider', '$locationProvider',
    function ($routeProvider, $locationProvider) {
        $locationProvider.html5Mode(true);
        $routeProvider.otherwise({
            redirectTo: '/dashboard'
        });
    }
]);

angular.module('app').run(['i18nNotifications',
    function (i18nNotifications) {
        // Get the current user when the application starts
        // (in case they are still logged in from a previous session)
        // security.requestCurrentUser();

        // i18nNotifications.pushSticky('test', 'success', {
        //     foo: 'bar'
        // });
    }
]);

angular.module('app').controller('AppCtrl', ['$scope', 'i18nNotifications', 'localizedMessages',
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
]);

angular.module('app').controller('HeaderCtrl', ['$scope', '$location', '$route', 'notifications',
    function ($scope, $location, $route, notifications) {
        $scope.location = $location;
        // $scope.breadcrumbs = breadcrumbs;

        // $scope.isAuthenticated = security.isAuthenticated;
        // $scope.isAdmin = security.isAdmin;

        $scope.home = function () {
            $location.path('/dashboard');
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

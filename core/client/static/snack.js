/*! snack - v0.0.0 - 2014-03-14
 * Copyright (c) 2014 Michael Shick;
 * Licensed 
 */
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

angular.module('resources.base', ['ngResource']);

angular.module('resources.base').factory('SnackResource', ['$resource',
    function ($resource) {

        function SnackResourceFactory(resourceType) {
            var apiPath = '/api/v1/' + resourceType;

            var thenFactoryMethod = function (httpPromise, successcb, errorcb, isArray) {
                var scb = successcb || angular.noop;
                var ecb = errorcb || angular.noop;

                return httpPromise.then(function (response) {
                    var result;
                    if (isArray) {
                        result = [];
                        for (var i = 0; i < response.items.length; i++) {
                            result.push(new Resource(response.items[i]));
                        }
                    }
                    scb(result, response.status, response.headers, response.config);
                    return result;
                }, function (response) {
                    ecb(undefined, response.status, response.headers, response.config);
                    return undefined;
                });
            };

            var Resource = function (data) {
                angular.extend(this, data);
            };

            Resource.all = function (cb, errorcb) {
                var resource = $resource(apiPath);
                var httpPromise = resource.get().$promise;
                return thenFactoryMethod(httpPromise, null, null, true);
            };

            return Resource;
        }

        return SnackResourceFactory;
    }
]);

// angular.module('mongolabResource', []).factory('mongolabResource', ['MONGOLAB_CONFIG', '$http', '$q',
//     function (MONGOLAB_CONFIG, $http, $q) {

//         function MongolabResourceFactory(collectionName) {

//             var url = MONGOLAB_CONFIG.baseUrl + MONGOLAB_CONFIG.dbName + '/collections/' + collectionName;
//             var defaultParams = {};
//             if (MONGOLAB_CONFIG.apiKey) {
//                 defaultParams.apiKey = MONGOLAB_CONFIG.apiKey;
//             }

//             var thenFactoryMethod = function (httpPromise, successcb, errorcb, isArray) {
//                 var scb = successcb || angular.noop;
//                 var ecb = errorcb || angular.noop;

//                 return httpPromise.then(function (response) {
//                     var result;
//                     if (isArray) {
//                         result = [];
//                         for (var i = 0; i < response.data.length; i++) {
//                             result.push(new Resource(response.data[i]));
//                         }
//                     } else {
//                         //MongoLab has rather peculiar way of reporting not-found items, I would expect 404 HTTP response status...
//                         if (response.data === " null ") {
//                             return $q.reject({
//                                 code: 'resource.notfound',
//                                 collection: collectionName
//                             });
//                         } else {
//                             result = new Resource(response.data);
//                         }
//                     }
//                     scb(result, response.status, response.headers, response.config);
//                     return result;
//                 }, function (response) {
//                     ecb(undefined, response.status, response.headers, response.config);
//                     return undefined;
//                 });
//             };

//             var Resource = function (data) {
//                 angular.extend(this, data);
//             };

//             Resource.all = function (cb, errorcb) {
//                 return Resource.query({}, cb, errorcb);
//             };

//             Resource.query = function (queryJson, successcb, errorcb) {
//                 var params = angular.isObject(queryJson) ? {
//                     q: JSON.stringify(queryJson)
//                 } : {};
//                 var httpPromise = $http.get(url, {
//                     params: angular.extend({}, defaultParams, params)
//                 });
//                 return thenFactoryMethod(httpPromise, successcb, errorcb, true);
//             };

//             Resource.getById = function (id, successcb, errorcb) {
//                 var httpPromise = $http.get(url + '/' + id, {
//                     params: defaultParams
//                 });
//                 return thenFactoryMethod(httpPromise, successcb, errorcb);
//             };

//             Resource.getByIds = function (ids, successcb, errorcb) {
//                 var qin = [];
//                 angular.forEach(ids, function (id) {
//                     qin.push({
//                         $oid: id
//                     });
//                 });
//                 return Resource.query({
//                     _id: {
//                         $in: qin
//                     }
//                 }, successcb, errorcb);
//             };

//             //instance methods

//             Resource.prototype.$id = function () {
//                 if (this._id && this._id.$oid) {
//                     return this._id.$oid;
//                 }
//             };

//             Resource.prototype.$save = function (successcb, errorcb) {
//                 var httpPromise = $http.post(url, this, {
//                     params: defaultParams
//                 });
//                 return thenFactoryMethod(httpPromise, successcb, errorcb);
//             };

//             Resource.prototype.$update = function (successcb, errorcb) {
//                 var httpPromise = $http.put(url + "/" + this.$id(), angular.extend({}, this, {
//                     _id: undefined
//                 }), {
//                     params: defaultParams
//                 });
//                 return thenFactoryMethod(httpPromise, successcb, errorcb);
//             };

//             Resource.prototype.$remove = function (successcb, errorcb) {
//                 var httpPromise = $http['delete'](url + "/" + this.$id(), {
//                     params: defaultParams
//                 });
//                 return thenFactoryMethod(httpPromise, successcb, errorcb);
//             };

//             Resource.prototype.$saveOrUpdate = function (savecb, updatecb, errorSavecb, errorUpdatecb) {
//                 if (this.$id()) {
//                     return this.$update(updatecb, errorUpdatecb);
//                 } else {
//                     return this.$save(savecb, errorSavecb);
//                 }
//             };

//             return Resource;
//         }
//         return MongolabResourceFactory;
//     }
// ]);

angular.module('resources.posts', ['resources.base']);

angular.module('resources.posts').factory('Posts', ['SnackResource',
    function ($SnackResource) {
        var Posts = $SnackResource('posts');
        return Posts;
    }
]);

// angular.module('resources.projects').factory('Projects', ['mongolabResource',

//     function ($mongolabResource) {

//         var Projects = $mongolabResource('projects');

//         Projects.forUser = function (userId, successcb, errorcb) {
//             //TODO: get projects for this user only (!)
//             return Projects.query({}, successcb, errorcb);
//         };

//         Projects.prototype.isProductOwner = function (userId) {
//             return this.productOwner === userId;
//         };
//         Projects.prototype.canActAsProductOwner = function (userId) {
//             return !this.isScrumMaster(userId) && !this.isDevTeamMember(userId);
//         };
//         Projects.prototype.isScrumMaster = function (userId) {
//             return this.scrumMaster === userId;
//         };
//         Projects.prototype.canActAsScrumMaster = function (userId) {
//             return !this.isProductOwner(userId);
//         };
//         Projects.prototype.isDevTeamMember = function (userId) {
//             return this.teamMembers.indexOf(userId) >= 0;
//         };
//         Projects.prototype.canActAsDevTeamMember = function (userId) {
//             return !this.isProductOwner(userId);
//         };

//         Projects.prototype.getRoles = function (userId) {
//             var roles = [];
//             if (this.isProductOwner(userId)) {
//                 roles.push('PO');
//             } else {
//                 if (this.isScrumMaster(userId)) {
//                     roles.push('SM');
//                 }
//                 if (this.isDevTeamMember(userId)) {
//                     roles.push('DEV');
//                 }
//             }
//             return roles;
//         };

//         return Projects;
//     }
// ]);

angular.module('services.i18nNotifications', ['services.notifications', 'services.localizedMessages'])
    .factory('i18nNotifications', ['localizedMessages', 'notifications',
        function (localizedMessages, notifications) {

            var prepareNotification = function (msgKey, type, interpolateParams, otherProperties) {
                return angular.extend({
                    message: localizedMessages.get(msgKey, interpolateParams),
                    type: type
                }, otherProperties);
            };

            var I18nNotifications = {
                pushSticky: function (msgKey, type, interpolateParams, otherProperties) {
                    return notifications.pushSticky(prepareNotification(msgKey, type, interpolateParams, otherProperties));
                },
                pushForCurrentRoute: function (msgKey, type, interpolateParams, otherProperties) {
                    return notifications.pushForCurrentRoute(prepareNotification(msgKey, type, interpolateParams, otherProperties));
                },
                pushForNextRoute: function (msgKey, type, interpolateParams, otherProperties) {
                    return notifications.pushForNextRoute(prepareNotification(msgKey, type, interpolateParams, otherProperties));
                },
                getCurrent: function () {
                    return notifications.getCurrent();
                },
                remove: function (notification) {
                    return notifications.remove(notification);
                }
            };

            return I18nNotifications;
        }
    ]);

angular.module('services.localizedMessages', [])
    .factory('localizedMessages', ['$interpolate', 'I18N.MESSAGES',
        function ($interpolate, i18nmessages) {

            var handleNotFound = function (msg, msgKey) {
                return msg || '?' + msgKey + '?';
            };

            return {
                get: function (msgKey, interpolateParams) {
                    var msg = i18nmessages[msgKey];
                    if (msg) {
                        return $interpolate(msg)(interpolateParams);
                    } else {
                        return handleNotFound(msg, msgKey);
                    }
                }
            };
        }
    ]);

angular.module('services.notifications', [])
    .factory('notifications', ['$rootScope',
        function ($rootScope) {

            var notifications = {
                'STICKY': [],
                'ROUTE_CURRENT': [],
                'ROUTE_NEXT': []
            };
            var notificationsService = {};

            var addNotification = function (notificationsArray, notificationObj) {
                if (!angular.isObject(notificationObj)) {
                    throw new Error("Only object can be added to the notification service");
                }
                notificationsArray.push(notificationObj);
                return notificationObj;
            };

            $rootScope.$on('$routeChangeSuccess', function () {
                notifications.ROUTE_CURRENT.length = 0;

                notifications.ROUTE_CURRENT = angular.copy(notifications.ROUTE_NEXT);
                notifications.ROUTE_NEXT.length = 0;
            });

            notificationsService.getCurrent = function () {
                return [].concat(notifications.STICKY, notifications.ROUTE_CURRENT);
            };

            notificationsService.pushSticky = function (notification) {
                return addNotification(notifications.STICKY, notification);
            };

            notificationsService.pushForCurrentRoute = function (notification) {
                return addNotification(notifications.ROUTE_CURRENT, notification);
            };

            notificationsService.pushForNextRoute = function (notification) {
                return addNotification(notifications.ROUTE_NEXT, notification);
            };

            notificationsService.remove = function (notification) {
                angular.forEach(notifications, function (notificationsByType) {
                    var idx = notificationsByType.indexOf(notification);
                    if (idx > -1) {
                        notificationsByType.splice(idx, 1);
                    }
                });
            };

            notificationsService.removeAll = function () {
                angular.forEach(notifications, function (notificationsByType) {
                    notificationsByType.length = 0;
                });
            };

            return notificationsService;
        }
    ]);

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

angular.module('app').constant('I18N.MESSAGES', {
    'test': '<strong>Test!</strong> A sample notification. Foo: {{foo}}',
    'errors.route.changeError': 'Route change error',
    'crud.user.save.success': "A user with id '{{id}}' was saved successfully.",
    'crud.user.remove.success': "A user with id '{{id}}' was removed successfully.",
    'crud.user.remove.error': "Something went wrong when removing user with id '{{id}}'.",
    'crud.user.save.error': "Something went wrong when saving a user...",
    'crud.project.save.success': "A project with id '{{id}}' was saved successfully.",
    'crud.project.remove.success': "A project with id '{{id}}' was removed successfully.",
    'crud.project.save.error': "Something went wrong when saving a project...",
    'login.reason.notAuthorized': "You do not have the necessary access permissions.  Do you want to login as someone else?",
    'login.reason.notAuthenticated': "You must be logged in to access this part of the application.",
    'login.error.invalidCredentials': "Login failed.  Please check your credentials and try again.",
    'login.error.serverError': "There was a problem with authenticating: {{exception}}."
});

angular.module('templates.app', ['dashboard/dashboard.tpl.html', 'header.tpl.html', 'notifications.tpl.html']);

angular.module("dashboard/dashboard.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("dashboard/dashboard.tpl.html",
    "<h4>Posts</h4>\n" +
    "  <table class=\"table table-striped-rows table-hover\">\n" +
    "    <thead>\n" +
    "      <tr>\n" +
    "          <th>Title</th>\n" +
    "          <th>Kind</th>\n" +
    "          <th>Created</th>\n" +
    "          <th>Updated</th>\n" +
    "      </tr>\n" +
    "    </thead>\n" +
    "    <tbody>\n" +
    "    <tr ng-repeat=\"post in posts\">\n" +
    "      <td>{{post.title}}</td>\n" +
    "      <td>{{post.kind}}</td>\n" +
    "      <td>{{post.createdAt}}</td>\n" +
    "      <td>{{post.updatedAt}}</td>\n" +
    "    </tr>\n" +
    "    </tbody>\n" +
    "  </table>\n" +
    "</div>\n" +
    "");
}]);

angular.module("header.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("header.tpl.html",
    "<nav class=\"navbar navbar-default navbar-fixed-top\" role=\"navigation\" ng-controller=\"HeaderCtrl\">\n" +
    "  <div class=\"container\">\n" +
    "    <!-- Brand and toggle get grouped for better mobile display -->\n" +
    "    <div class=\"navbar-header\">\n" +
    "      <button type=\"button\" class=\"navbar-toggle\" data-toggle=\"collapse\" data-target=\"#navbar-collapse\">\n" +
    "        <span class=\"sr-only\">Toggle navigation</span>\n" +
    "        <span class=\"icon-bar\"></span>\n" +
    "        <span class=\"icon-bar\"></span>\n" +
    "        <span class=\"icon-bar\"></span>\n" +
    "      </button>\n" +
    "      <a class=\"navbar-brand\" href=\"#\" ng-click=\"home()\">Home</a>\n" +
    "    </div>\n" +
    "\n" +
    "    <!-- Collect the nav links, forms, and other content for toggling -->\n" +
    "    <div class=\"collapse navbar-collapse\" id=\"navbar-collapse\">\n" +
    "      <ul class=\"nav navbar-nav\"></ul>\n" +
    "    </div>\n" +
    "  </div>\n" +
    "</nav>\n" +
    "");
}]);

angular.module("notifications.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("notifications.tpl.html",
    "<div ng-class=\"['alert', 'alert-dismissable', 'alert-'+notification.type]\" ng-repeat=\"notification in notifications.getCurrent()\">\n" +
    "  <button type=\"button\" class=\"close\" data-dismiss=\"alert\" aria-hidden=\"true\" ng-click=\"removeNotification(notification)\">&times;</button>\n" +
    "  <span ng-bind-html=\"notification.message\">{{notification.message}}</span>\n" +
    "</div>\n" +
    "");
}]);

angular.module('templates.common', []);


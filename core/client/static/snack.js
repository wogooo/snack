/*! snack - v0.0.1 - 2014-04-02
 * Copyright (c) 2014 ;
 * Licensed MIT
 */
angular.module('app', [
    'ui.bootstrap',
    'ngRoute',
    'ngResource',
    'ngSanitize',
    'dashboard',
    'posts',
    'assets',
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

angular.module('assets', ['resources.assets'])

.config(['$routeProvider',
    function ($routeProvider) {
        $routeProvider.when('/assets/:id/edit', {
            templateUrl: 'assets/assets-edit.tpl.html',
            controller: 'AssetsEditCtrl',
            resolve: {
                asset: ['$route', 'AssetsResource',
                    function ($route, AssetsResource) {
                        return AssetsResource.find({
                            id: $route.current.params.id
                        });
                    }
                ]
            }
        });

        $routeProvider.when('/assets', {
            templateUrl: 'assets/assets-list.tpl.html',
            controller: 'AssetsListCtrl',
            resolve: {
                assetList: ['AssetsResource',
                    function (AssetsResource) {
                        return AssetsResource.list();
                    }
                ]
            }
        });
    }
])

.controller('AssetsListCtrl', ['$scope', '$location', 'assetList',
    function ($scope, $location, assetList) {
        $scope.assetList = assetList;

        $scope.editAsset = function (asset) {
            $location.path('/assets/' + asset.id + '/edit');
        };
    }
])

.controller('AssetsEditCtrl', ['$scope', '$routeParams', '$location', 'asset',
    function ($scope, $routeParams, $location, asset) {

        $scope.asset = asset;

        $scope.save = function () {
            asset.$update(function () {
                $location.path('/assets');
            });
        };

        $scope.remove = function () {
            asset.$remove(function () {
                $location.path('/assets');
            });
        };
    }
]);

angular.module('models.asset', ['ur.file', 'ngResource'])

.factory('Asset', ['$resource', '$q',

    function ($resource, $q) {

        var apiUrl = '/api/v1/assets/:id.json';

        var defaultParams = {
            id: '@id'
        };

        var actions = {
            update: {
                method: 'PUT'
            }
        };

        var Asset = $resource(apiUrl, defaultParams, actions);
        var Files = $resource('/api/v1/files');

        Asset.prototype.$upload = function (upload) {

            var asset = this;
            var deferred = $q.defer();

            // TODO: custom upload XHR, so I can get progress into the upload
            // scope.

            Files.prototype.$save.call(upload.file, function (self, headers) {

                angular.extend(asset, self);
                deferred.resolve();
            });

            return deferred.promise;
        };

        return Asset;
    }
]);

angular.module('models.assetList', ['ngResource', 'models.asset'])

.factory('AssetList', ['$resource', 'Asset',

    function ($resource, Asset) {

        var apiUrl = '/api/v1/assets.json';

        var defaultParams = {};

        var actions = {
            get: {
                method: 'GET',
                interceptor: {
                    response: function (response) {

                        var resource = response.resource;

                        // Vivify posts in list
                        for (var i = 0; i < resource.items.length; i++) {
                            resource.items[i] = new Asset(resource.items[i]);
                        }

                        return response;
                    },
                    responseError: function (response) {
                        console.log('asset interceptor err');
                    }
                }
            }
        };

        return $resource(apiUrl, defaultParams, actions);
    }
]);

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

angular.module('models.postList', ['ngResource', 'models.post'])

.factory('PostList', ['$resource', 'Post',

    function ($resource, Post) {

        var apiUrl = '/api/v1/posts.json';

        var defaultParams = {
            id: '@id'
        };

        var actions = {
            get: {
                method: 'GET',
                interceptor: {
                    response: function (response) {

                        var resource = response.resource;

                        // Vivify posts in list
                        for (var i = 0; i < resource.items.length; i++) {
                            resource.items[i] = new Post(resource.items[i]);
                        }

                        return response;
                    },
                    responseError: function (response) {
                        console.log('interceptor err');
                    }
                }
            }
        };

        return $resource(apiUrl, defaultParams, actions);
    }
]);

angular.module('models.tag', ['ngResource'])

.factory('Tag', ['$resource',

    function ($resource) {

        var apiUrl = '/api/v1/tags/:id.json';

        var defaultParams = {
            id: '@id'
        };

        var actions = {
            update: {
                method: 'PUT'
            }
        };

        var Tag = $resource(apiUrl, defaultParams, actions);

        return Tag;
    }
]);

angular.module('models.tagList', ['ngResource', 'models.tag'])

.factory('TagList', ['$resource', 'Tag',

    function ($resource, Tag) {

        var apiUrl = '/api/v1/tags.json?autocomplete=:key';

        var defaultParams = {
            key: '@key'
        };

        var actions = {
            get: {
                method: 'GET',
                interceptor: {
                    response: function (response) {

                        var resource = response.resource;

                        // Vivify tags in list
                        for (var i = 0; i < resource.items.length; i++) {
                            resource.items[i] = new Tag(resource.items[i]);
                        }

                        return response;
                    },
                    responseError: function (response) {
                        console.log('interceptor err');
                    }
                }
            }
        };

        return $resource(apiUrl, defaultParams, actions);
    }
]);

angular.module('resources.assets', ['models.asset', 'models.assetList'])

.factory('AssetsResource', ['Asset', 'AssetList',

    function (Asset, AssetList) {

        var Resource = function (data) {

            if (data.type === 'asset') {

                return new Asset(data);

            } else if (data.type === 'assetList') {

                return new AssetList(data);
            }
        };

        Resource.list = function (query) {
            return AssetList.get(query);
        };

        Resource.find = function (query) {
            return Asset.get(query);
        };

        return Resource;
    }
]);

angular.module('resources.base', ['ngResource'])
    .factory('BaseResource', ['$resource',
        function ($resource) {

            function BaseResourceFactory(resourceType) {

                var apiPath = '/api/v1/' + resourceType;
                var defaultParams = {};

                var resource = $resource(apiPath + '/:id.json', {
                    id: '@id'
                }, defaultParams);

                var thenFactoryMethod = function (httpPromise, isArray) {

                    return httpPromise.then(function (response) {

                        var result = {};

                        if (isArray) {
                            result.items = [];
                            for (var i = 0; i < response.items.length; i++) {
                                result.items.push(new Resource(response.items[i]));
                            }
                        } else {
                            result = new Resource(response);
                        }

                        return result;

                    }, function (response) {

                        return undefined;
                    });
                };

                var Resource = function (data) {
                    angular.extend(this, data);
                };

                Resource.list = function (query) {
                    return Resource.query(query, true);
                };

                Resource.find = function (id) {
                    return Resource.query({
                        id: id
                    });
                };

                Resource.query = function (query, isArray) {

                    query = angular.isObject(query) ? query : {};

                    var promise = resource.get(query).$promise;
                    return thenFactoryMethod(promise, isArray);
                };

                Resource.prototype.$save = function () {
                    var promise = resource.post().$promise;
                    return thenFactoryMethod(promise);
                };

                Resource.prototype.$update = function () {
                    var promise = resource.put().$promise;
                    return thenFactoryMethod(promise);
                };

                return Resource;
            }

            return BaseResourceFactory;
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

angular.module('resources.posts', ['models.post', 'models.postList'])

.factory('PostsResource', ['Post', 'PostList',

    function (Post, PostList) {

        // function PostsResourceFactory() {

        var Resource = function (data) {

            if (data.type === 'post') {

                return new Post(data);

            } else if (data.type === 'postList') {

                return new PostList(data);
            }
        };

        Resource.list = function (query) {
            return PostList.get(query);
        };

        Resource.find = function (query) {
            return Post.get(query);
        };

        return Resource;
    }

    // return PostsResourceFactory();
    // }
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

angular.module('resources.tags', ['models.tag', 'models.tagList'])

.factory('TagsResource', ['Tag', 'TagList',

    function (Tag, TagList) {

        var Resource = function (data) {

            if (data.type === 'tag') {

                return new Tag(data);

            } else if (data.type === 'tagList') {

                return new TagList(data);
            }
        };

        Resource.list = function (query) {
            return TagList.get(query);
        };

        Resource.find = function (query) {
            return Tag.get(query);
        };

        return Resource;
    }
]);

angular.module('security.authorization', ['security.service'])

// This service provides guard methods to support AngularJS routes.
// You can add them as resolves to routes to require authorization levels
// before allowing a route change to complete
.provider('securityAuthorization', {

  requireAdminUser: ['securityAuthorization', function(securityAuthorization) {
    return securityAuthorization.requireAdminUser();
  }],

  requireAuthenticatedUser: ['securityAuthorization', function(securityAuthorization) {
    return securityAuthorization.requireAuthenticatedUser();
  }],

  $get: ['security', 'securityRetryQueue', function(security, queue) {
    var service = {

      // Require that there is an authenticated user
      // (use this in a route resolve to prevent non-authenticated users from entering that route)
      requireAuthenticatedUser: function() {
        var promise = security.requestCurrentUser().then(function(userInfo) {
          if ( !security.isAuthenticated() ) {
            return queue.pushRetryFn('unauthenticated-client', service.requireAuthenticatedUser);
          }
        });
        return promise;
      },

      // Require that there is an administrator logged in
      // (use this in a route resolve to prevent non-administrators from entering that route)
      requireAdminUser: function() {
        var promise = security.requestCurrentUser().then(function(userInfo) {
          if ( !security.isAdmin() ) {
            return queue.pushRetryFn('unauthorized-client', service.requireAdminUser);
          }
        });
        return promise;
      }

    };

    return service;
  }]
});
// Based loosely around work by Witold Szczerba - https://github.com/witoldsz/angular-http-auth
angular.module('security', [
  'security.service',
  'security.interceptor',
  'security.login',
  'security.authorization']);

angular.module('security.interceptor', ['security.retryQueue'])

// This http interceptor listens for authentication failures
.factory('securityInterceptor', ['$injector', 'securityRetryQueue', function($injector, queue) {
  return function(promise) {
    // Intercept failed requests
    return promise.then(null, function(originalResponse) {
      if(originalResponse.status === 401) {
        // The request bounced because it was not authorized - add a new request to the retry queue
        promise = queue.pushRetryFn('unauthorized-server', function retryRequest() {
          // We must use $injector to get the $http service to prevent circular dependency
          return $injector.get('$http')(originalResponse.config);
        });
      }
      return promise;
    });
  };
}])

// We have to add the interceptor to the queue as a string because the interceptor depends upon service instances that are not available in the config block.
.config(['$httpProvider', function($httpProvider) {
  $httpProvider.responseInterceptors.push('securityInterceptor');
}]);
angular.module('security.login.form', ['services.localizedMessages'])

// The LoginFormController provides the behaviour behind a reusable form to allow users to authenticate.
// This controller and its template (login/form.tpl.html) are used in a modal dialog box by the security service.
.controller('LoginFormController', ['$scope', 'security', 'localizedMessages', function($scope, security, localizedMessages) {
  // The model for this form 
  $scope.user = {};

  // Any error message from failing to login
  $scope.authError = null;

  // The reason that we are being asked to login - for instance because we tried to access something to which we are not authorized
  // We could do something diffent for each reason here but to keep it simple...
  $scope.authReason = null;
  if ( security.getLoginReason() ) {
    $scope.authReason = ( security.isAuthenticated() ) ?
      localizedMessages.get('login.reason.notAuthorized') :
      localizedMessages.get('login.reason.notAuthenticated');
  }

  // Attempt to authenticate the user specified in the form's model
  $scope.login = function() {
    // Clear any previous security errors
    $scope.authError = null;

    // Try to login
    security.login($scope.user.email, $scope.user.password).then(function(loggedIn) {
      if ( !loggedIn ) {
        // If we get here then the login failed due to bad credentials
        $scope.authError = localizedMessages.get('login.error.invalidCredentials');
      }
    }, function(x) {
      // If we get here then there was a problem with the login request to the server
      $scope.authError = localizedMessages.get('login.error.serverError', { exception: x });
    });
  };

  $scope.clearForm = function() {
    $scope.user = {};
  };

  $scope.cancelLogin = function() {
    security.cancelLogin();
  };
}]);

angular.module('security.login', ['security.login.form', 'security.login.toolbar']);
angular.module('security.login.toolbar', [])

// The loginToolbar directive is a reusable widget that can show login or logout buttons
// and information the current authenticated user
.directive('loginToolbar', ['security', function(security) {
  var directive = {
    templateUrl: 'common/security/login/toolbar.tpl.html',
    restrict: 'E',
    replace: true,
    scope: true,
    link: function($scope, $element, $attrs, $controller) {
      $scope.isAuthenticated = security.isAuthenticated;
      $scope.login = security.showLogin;
      $scope.logout = security.logout;
      $scope.$watch(function() {
        return security.currentUser;
      }, function(currentUser) {
        $scope.currentUser = currentUser;
      });
    }
  };
  return directive;
}]);

angular.module('security.retryQueue', [])

// This is a generic retry queue for security failures.  Each item is expected to expose two functions: retry and cancel.
.factory('securityRetryQueue', ['$q', '$log', function($q, $log) {
  var retryQueue = [];
  var service = {
    // The security service puts its own handler in here!
    onItemAddedCallbacks: [],
    
    hasMore: function() {
      return retryQueue.length > 0;
    },
    push: function(retryItem) {
      retryQueue.push(retryItem);
      // Call all the onItemAdded callbacks
      angular.forEach(service.onItemAddedCallbacks, function(cb) {
        try {
          cb(retryItem);
        } catch(e) {
          $log.error('securityRetryQueue.push(retryItem): callback threw an error' + e);
        }
      });
    },
    pushRetryFn: function(reason, retryFn) {
      // The reason parameter is optional
      if ( arguments.length === 1) {
        retryFn = reason;
        reason = undefined;
      }

      // The deferred object that will be resolved or rejected by calling retry or cancel
      var deferred = $q.defer();
      var retryItem = {
        reason: reason,
        retry: function() {
          // Wrap the result of the retryFn into a promise if it is not already
          $q.when(retryFn()).then(function(value) {
            // If it was successful then resolve our deferred
            deferred.resolve(value);
          }, function(value) {
            // Othewise reject it
            deferred.reject(value);
          });
        },
        cancel: function() {
          // Give up on retrying and reject our deferred
          deferred.reject();
        }
      };
      service.push(retryItem);
      return deferred.promise;
    },
    retryReason: function() {
      return service.hasMore() && retryQueue[0].reason;
    },
    cancelAll: function() {
      while(service.hasMore()) {
        retryQueue.shift().cancel();
      }
    },
    retryAll: function() {
      while(service.hasMore()) {
        retryQueue.shift().retry();
      }
    }
  };
  return service;
}]);

// Based loosely around work by Witold Szczerba - https://github.com/witoldsz/angular-http-auth
angular.module('security.service', [
  'security.retryQueue', // Keeps track of failed requests that need to be retried once the user logs in
  'security.login', // Contains the login form template and controller
  'ui.bootstrap' // Used to display the login form as a modal dialog.
])

.factory('security', ['$http', '$q', '$location', 'securityRetryQueue', '$modal', '$window',
  function ($http, $q, $location, queue, $modal, $window) {

    // Redirect to the given url (defaults to '/')
    function redirect(url) {
      url = url || '/snack/login';
      $window.location.href = url;
    }

    // Login form dialog stuff
    var loginDialog = null;

    function openLoginDialog() {
      if (loginDialog) {
        throw new Error('Trying to open a dialog that is already open!');
      }

      loginDialog = $modal.open({
        templateUrl: 'common/security/login/form.tpl.html',
        controller: 'LoginFormController'
      });

      loginDialog.result.then(onLoginDialogClose);
    }

    function closeLoginDialog(success) {
      if (loginDialog) {
        loginDialog.close(success);
      }
    }

    function onLoginDialogClose(success) {
      loginDialog = null;
      if (success) {
        queue.retryAll();
      } else {
        queue.cancelAll();
        redirect();
      }
    }

    // Register a handler for when an item is added to the retry queue
    queue.onItemAddedCallbacks.push(function (retryItem) {
      if (queue.hasMore()) {
        service.showLogin();
      }
    });

    // The public API of the service
    var service = {

      // Get the first reason for needing a login
      getLoginReason: function () {
        return queue.retryReason();
      },

      // Show the modal login dialog
      showLogin: function () {
        openLoginDialog();
      },

      // Attempt to authenticate a user by the given username and password
      login: function (username, password) {
        var request = $http.post('/snack/login', {
          username: username,
          password: password
        });
        return request.then(function (response) {
          service.currentUser = response.data;
          if (service.isAuthenticated()) {
            closeLoginDialog(true);
          }
          return service.isAuthenticated();
        });
      },

      // Give up trying to login and clear the retry queue
      cancelLogin: function () {
        closeLoginDialog(false);
        redirect();
      },

      // Logout the current user and redirect
      logout: function (redirectTo) {
        $http.post('/snack/logout').then(function () {
          service.currentUser = null;
          redirect();
        });
      },

      // Ask the backend to see if a user is already authenticated - this may be from a previous session.
      requestCurrentUser: function () {

        if (service.isAuthenticated()) {
          return $q.when(service.currentUser);
        } else {
          return $http.get('/api/v1/users/current.json').then(function (response) {
            service.currentUser = response.data;
            return service.currentUser;
          });
        }
      },

      // Information about the current user
      currentUser: null,

      // Is the current user authenticated?
      isAuthenticated: function () {
        return !!service.currentUser;
      },

      // Is the current user an adminstrator?
      isAdmin: function () {
        return !!(service.currentUser && service.currentUser.admin);
      }
    };

    return service;
  }
]);

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

angular.module('app').constant('I18N.MESSAGES', {
    'test': '<strong>Test!</strong> A sample notification. Foo: {{foo}}',
    'errors.route.changeError': 'Route change error',
    'crud.user.save.success': "A user with id '{{id}}' was saved successfully.",
    'crud.user.remove.success': "A user with id '{{id}}' was removed successfully.",
    'crud.user.remove.error': "Something went wrong when removing user with id '{{id}}'.",
    'crud.user.save.error': "Something went wrong when saving a user...",
    'crud.post.save.success': "The post '{{title}}' was saved successfully.",
    'login.reason.notAuthorized': "You do not have the necessary access permissions.  Do you want to login as someone else?",
    'login.reason.notAuthenticated': "You must be logged in to access this part of the application.",
    'login.error.invalidCredentials': "Login failed.  Please check your credentials and try again.",
    'login.error.serverError': "There was a problem with authenticating: {{exception}}."
});

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

angular.module('templates.app', ['assets/assets-edit.tpl.html', 'assets/assets-list.tpl.html', 'common/security/login/form.tpl.html', 'common/security/login/toolbar.tpl.html', 'dashboard/dashboard.tpl.html', 'header.tpl.html', 'notifications.tpl.html', 'posts/posts-edit.tpl.html', 'posts/posts-list.tpl.html']);

angular.module("assets/assets-edit.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("assets/assets-edit.tpl.html",
    "<form name=\"form\" novalidate>\n" +
    "\n" +
    "  <legend>Asset</legend>\n" +
    "\n" +
    "  <div class=\"well well-lg\">\n" +
    "    <figure class=\"row\">\n" +
    "      <div class=\"col-md-12\">\n" +
    "        <img class=\"img-thumbnail img-responsive center-block\" ng-src=\"{{asset.url}}\" />\n" +
    "      </div>\n" +
    "    </figure>\n" +
    "  </div>\n" +
    "\n" +
    "  <div class=\"well well-lg\">\n" +
    "    <dl>\n" +
    "      <div class=\"row\">\n" +
    "        <div class=\"col-xs-6\">\n" +
    "          <dt>Filename</dt>\n" +
    "          <dd>{{asset.filename}}</dd>\n" +
    "          <dt>Size</dt>\n" +
    "          <dd>{{asset.bytes}}</dd>\n" +
    "          <dt>Mime</dt>\n" +
    "          <dd>{{asset.mimetype}}</dd>\n" +
    "          <dt>Storage</dt>\n" +
    "          <dd>{{asset.storage}}</dd>\n" +
    "        </div>\n" +
    "\n" +
    "        <div class=\"col-xs-6\">\n" +
    "          <dt>Type</dt>\n" +
    "          <dd>{{asset.type}}</dd>\n" +
    "          <dt>Height</dt>\n" +
    "          <dd>{{asset.height}}</dd>\n" +
    "          <dt>Width</dt>\n" +
    "          <dd>{{asset.width}}</dd>\n" +
    "          <dt>Created</dt>\n" +
    "          <dd>{{asset.createdAt}}</dd>\n" +
    "        </div>\n" +
    "      </div>\n" +
    "    </dl>\n" +
    "  </div>\n" +
    "\n" +
    "  <div class=\"form-group\">\n" +
    "    <label>Title</label>\n" +
    "    <input type=\"text\" class=\"form-control\" name=\"title\" ng-model=\"asset.title\" />\n" +
    "  </div>\n" +
    "  <div class=\"form-group\">\n" +
    "    <label>Description</label>\n" +
    "    <textarea class=\"form-control\" name=\"description\" rows=\"2\" ng-model=\"asset.description\"></textarea>\n" +
    "  </div>\n" +
    "\n" +
    "  <div class=\"panel panel-default\" ng-show=\"asset.posts\">\n" +
    "\n" +
    "    <div class=\"panel-heading\">\n" +
    "      <h4 class=\"panel-title\">\n" +
    "        <a ng-click=\"isCollapsed = !isCollapsed\">\n" +
    "          Related Posts\n" +
    "        </a>\n" +
    "      </h4>\n" +
    "    </div>\n" +
    "\n" +
    "    <div class=\"panel-collapse collapse\" collapse=\"isCollapsed\">\n" +
    "      <div class=\"panel-body\">\n" +
    "        <ul>\n" +
    "          <li ng-repeat=\"post in asset.posts\">\n" +
    "            <a ng-href=\"/admin/posts/{{post.id}}/edit\">{{post.title}}</a>\n" +
    "          </li>\n" +
    "        </ul>\n" +
    "      </div>\n" +
    "    </div>\n" +
    "\n" +
    "  </div>\n" +
    "\n" +
    "  <hr>\n" +
    "\n" +
    "  <button ng-click=\"save()\" class=\"btn btn-large btn-primary\">Save</button>\n" +
    "\n" +
    "</form>\n" +
    "");
}]);

angular.module("assets/assets-list.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("assets/assets-list.tpl.html",
    "<table class=\"table table-striped-rows table-hover\">\n" +
    "  <thead>\n" +
    "    <tr>\n" +
    "        <th>Filename</th>\n" +
    "        <th>Kind</th>\n" +
    "        <th>Created</th>\n" +
    "        <th>Actions</th>\n" +
    "    </tr>\n" +
    "  </thead>\n" +
    "  <tbody>\n" +
    "  <tr ng-repeat=\"asset in assetList.items\">\n" +
    "    <td>{{asset.filename}}</td>\n" +
    "    <td>{{asset.kind}}</td>\n" +
    "    <td>{{asset.createdAt | date:'yyyy-MM-dd h:mma'}}</td>\n" +
    "    <td>\n" +
    "      <a ng-click=\"editAsset(asset)\">Edit</a>\n" +
    "    </td>\n" +
    "  </tr>\n" +
    "  </tbody>\n" +
    "</table>\n" +
    "");
}]);

angular.module("common/security/login/form.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("common/security/login/form.tpl.html",
    "<form name=\"form\" novalidate class=\"login-form\">\n" +
    "    <div class=\"modal-header\">\n" +
    "        <h4>Sign in</h4>\n" +
    "    </div>\n" +
    "    <div class=\"modal-body\">\n" +
    "        <div class=\"alert alert-warning\" ng-show=\"authReason\">\n" +
    "            {{authReason}}\n" +
    "        </div>\n" +
    "        <div class=\"alert alert-error\" ng-show=\"authError\">\n" +
    "            {{authError}}\n" +
    "        </div>\n" +
    "        <input type=\"text\" name=\"username\" ng-model=\"user.username\" class=\"form-control\" placeholder=\"Email or Username\" required autofocus>\n" +
    "        <input type=\"password\" name=\"password\" ng-model=\"user.password\" class=\"form-control\" placeholder=\"Password\" required>\n" +
    "    </div>\n" +
    "    <div class=\"modal-footer\">\n" +
    "        <button class=\"btn btn-primary login\" ng-click=\"login()\" ng-disabled='form.$invalid'>Sign in</button>\n" +
    "        <button class=\"btn btn-warning cancel\" ng-click=\"cancelLogin()\">Cancel</button>\n" +
    "    </div>\n" +
    "</form>\n" +
    "");
}]);

angular.module("common/security/login/toolbar.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("common/security/login/toolbar.tpl.html",
    "<ul class=\"nav navbar-nav navbar-right\">\n" +
    "  <li class=\"dropdown\" ng-show=\"isAuthenticated()\">\n" +
    "      <a href=\"#\" class=\"dropdown-toggle\">\n" +
    "        {{currentUser.displayName}}\n" +
    "        <b class=\"caret\"></b>\n" +
    "      </a>\n" +
    "      <ul class=\"dropdown-menu\">\n" +
    "        <li class=\"divider\"></li>\n" +
    "        <li ng-show=\"isAuthenticated()\" class=\"logout\">\n" +
    "          <button class=\"btn btn-link\" ng-click=\"logout()\">Log out</button>\n" +
    "        </li>\n" +
    "      </ul>\n" +
    "  </li>\n" +
    "  <li ng-hide=\"isAuthenticated()\" class=\"login\">\n" +
    "    <form class=\"navbar-form\">\n" +
    "      <button class=\"btn login\" ng-click=\"login()\">Log in</button>\n" +
    "    </form>\n" +
    "  </li>\n" +
    "</ul>\n" +
    "");
}]);

angular.module("dashboard/dashboard.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("dashboard/dashboard.tpl.html",
    "<h4>Posts</h4>\n" +
    "<div ng-include=\"'posts/posts-list.tpl.html'\">\n" +
    "</div>\n" +
    "");
}]);

angular.module("header.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("header.tpl.html",
    "<nav class=\"navbar navbar-default navbar-fixed-top\" role=\"navigation\" ng-controller=\"HeaderCtrl\">\n" +
    "  <div class=\"container\">\n" +
    "    <!-- Brand and toggle get grouped for better mobile display -->\n" +
    "    <div class=\"navbar-header\">\n" +
    "      <button ng-init=\"navCollapsed = true\" ng-click=\"navCollapsed = !navCollapsed\" type=\"button\" class=\"navbar-toggle\">\n" +
    "        <span class=\"sr-only\">Toggle navigation</span>\n" +
    "        <span class=\"icon-bar\"></span>\n" +
    "        <span class=\"icon-bar\"></span>\n" +
    "        <span class=\"icon-bar\"></span>\n" +
    "      </button>\n" +
    "      <a class=\"navbar-brand\" href=\"/snack/dashboard\">Dashboard</a>\n" +
    "    </div>\n" +
    "\n" +
    "    <!-- Collect the nav links, forms, and other content for toggling -->\n" +
    "    <div class=\"collapse navbar-collapse\" id=\"navbar-collapse\" collapse=\"navCollapsed\">\n" +
    "      <ul class=\"nav navbar-nav\">\n" +
    "        <li><a href=\"/snack/posts\">Posts</a></li>\n" +
    "        <li><a href=\"/snack/assets\">Assets</a></li>\n" +
    "      </ul>\n" +
    "\n" +
    "      <login-toolbar></login-toolbar>\n" +
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

angular.module("posts/posts-edit.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("posts/posts-edit.tpl.html",
    "<form name=\"form\" novalidate>\n" +
    "  <legend>Post</legend>\n" +
    "\n" +
    "  <div class=\"row\">\n" +
    "    <div class=\"col-sm-8\">\n" +
    "      <div class=\"form-group\">\n" +
    "        <label class=\"sr-only\">Headline</label>\n" +
    "        <text-angular\n" +
    "          placeholder=\"[Snappy Headline]\"\n" +
    "          name=\"headline\"\n" +
    "          ng-model=\"post.headline\"\n" +
    "          ta-toolbar-group-class=\"btn-group btn-group-sm\"\n" +
    "          ta-toolbar=\"[['bold','italics']]\"\n" +
    "          ta-text-editor-class=\"ta-form-control ta-input-lg\"\n" +
    "          ta-html-editor-class=\"ta-form-control ta-input-lg\"></text-angular>\n" +
    "      </div>\n" +
    "      <div class=\"form-group\">\n" +
    "        <label class=\"sr-only\">Body</label>\n" +
    "        <text-angular\n" +
    "          placeholder=\"[The story.]\"\n" +
    "          name=\"body\"\n" +
    "          ng-model=\"post.body\"\n" +
    "          ta-toolbar-group-class=\"btn-group btn-group-sm\"\n" +
    "          ta-toolbar=\"[['h1','h2','h3'],['p','ol','ul'],['bold','italics', 'underline']]\"\n" +
    "          ta-text-editor-class=\"ta-form-textarea\"\n" +
    "          ta-html-editor-class=\"ta-form-textarea\"></text-angular>\n" +
    "      </div>\n" +
    "    </div>\n" +
    "\n" +
    "    <div class=\"col-sm-4\">\n" +
    "\n" +
    "      <div class=\"panel panel-default\">\n" +
    "        <div class=\"panel-heading\">\n" +
    "          <h4 class=\"panel-title\">Tags</h4>\n" +
    "        </div>\n" +
    "        <div class=\"panel-body\">\n" +
    "\n" +
    "          <div ng-repeat=\"tag in post.tags\">\n" +
    "            <h4>\n" +
    "              <span class=\"label label-info\">{{tag.name}}</span>\n" +
    "              <button type=\"button\" class=\"close\" aria-hidden=\"true\" ng-click=\"removeTag(tag)\">&times;</button>\n" +
    "            </h4>\n" +
    "          </div>\n" +
    "\n" +
    "          <div class=\"form-group\">\n" +
    "            <label class=\"sr-only\">New Tag</label>\n" +
    "            <input\n" +
    "              type=\"text\"\n" +
    "              ng-model=\"selectedTag\"\n" +
    "              placeholder=\"New tag...\"\n" +
    "              typeahead=\"tag as tag.name for tag in tagsAutocomplete($viewValue) | filter:$viewValue\"\n" +
    "              typeahead-editable=\"false\"\n" +
    "              typeahead-loading=\"loadingTags\"\n" +
    "              typeahead-on-select=\"addTag(selectedTag)\" />\n" +
    "            <i ng-show=\"loadingTags\" class=\"glyphicon glyphicon-refresh\"></i>\n" +
    "          </div>\n" +
    "\n" +
    "        </div>\n" +
    "      </div>\n" +
    "\n" +
    "      <div class=\"panel panel-default\">\n" +
    "        <div class=\"panel-heading\">\n" +
    "          <h4 class=\"panel-title\">Assets</h4>\n" +
    "        </div>\n" +
    "        <div class=\"panel-body\">\n" +
    "\n" +
    "          <div class=\"row\">\n" +
    "            <div ng-repeat=\"asset in post.assets\">\n" +
    "              <div class=\"col-xs-6 col-md-4\">\n" +
    "                <a class=\"thumbnail\" ng-click=\"editAsset(asset)\">\n" +
    "                  <img ng-src=\"{{asset.url}}\" />\n" +
    "                </a>\n" +
    "              </div>\n" +
    "            </div>\n" +
    "          </div>\n" +
    "\n" +
    "          <div class=\"form-group\">\n" +
    "            <label>File</label>\n" +
    "            <input type=\"file\" ng-model=\"upload.file\" change=\"createAsset(upload)\" />\n" +
    "          </div>\n" +
    "        </div>\n" +
    "      </div>\n" +
    "    </div>\n" +
    "\n" +
    "  </div>\n" +
    "\n" +
    "  <hr>\n" +
    "\n" +
    "  <button ng-click=\"save()\" class=\"btn btn-large btn-primary\">Save</button>\n" +
    "  <button ng-click=\"remove()\" class=\"btn btn-large btn-danger\">Remove</button>\n" +
    "\n" +
    "</form>\n" +
    "\n" +
    "");
}]);

angular.module("posts/posts-list.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("posts/posts-list.tpl.html",
    "<table class=\"table table-striped-rows table-hover\">\n" +
    "  <thead>\n" +
    "    <tr>\n" +
    "        <th>Title</th>\n" +
    "        <th>Kind</th>\n" +
    "        <th>Created</th>\n" +
    "        <th>Actions</th>\n" +
    "    </tr>\n" +
    "  </thead>\n" +
    "  <tbody>\n" +
    "  <tr ng-repeat=\"post in postList.items\">\n" +
    "    <td>{{post.title}}</td>\n" +
    "    <td>{{post.kind}}</td>\n" +
    "    <td>{{post.createdAt | date:'yyyy-MM-dd h:mma'}}</td>\n" +
    "    <td>\n" +
    "      <a ng-click=\"editPost(post)\">Edit</a>\n" +
    "    </td>\n" +
    "  </tr>\n" +
    "  </tbody>\n" +
    "</table>\n" +
    "\n" +
    "<div class=\"well\">\n" +
    "    <button class=\"btn\" ng-click=\"newPost()\">New post</button>\n" +
    "</div>\n" +
    "");
}]);

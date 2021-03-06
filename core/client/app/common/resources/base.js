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

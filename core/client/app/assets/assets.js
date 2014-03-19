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

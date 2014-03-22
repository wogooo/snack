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

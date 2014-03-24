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

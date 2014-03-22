
// `id` and `type` are important for
// using the search api, and getting
// data back from Snack.

var defaultMap = {
    'id': 'id',
    'type_s': 'type',
    'title_s': 'title',
    'title_t': {
        value: 'title',
        boost: 2.0
    },
    'body_t': {
        stripHtml: true,
        value: function (model) {
            return model.body;
        }
    },
    'tags_txt': {
        value: function (model) {

            var tags = [];

            if (model.tags && model.tags.forEach) {
                model.tags.forEach(function (tag) {
                    tags.push(tag.name);
                });
            }

            return tags;
        }
    }
};

exports['default'] = defaultMap;

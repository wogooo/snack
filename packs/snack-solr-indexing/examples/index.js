
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
    'body_t': function (model) {
        return model.body;
    }
};

exports['default'] = defaultMap;

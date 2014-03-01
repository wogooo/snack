var defaultMap = {
    'id': 'id',
    'title_s': 'title',
    'title_t': {
        value: 'title',
        boost: 2.0
    },
    'crazy_ss': ['timestamp', 'date'],
    'content_t': function (model) {
        return model.content;
    }
};

exports['default'] = defaultMap;

var internals = {};

internals.checkDirty = function (fields, data, was) {

    var dirty = {},
        field;

    for (var f in fields) {

        field = fields[f];

        dirty[field] = false;

        if (data[field] !== was[field]) {
            dirty[field] = true;
        }
    }

    return dirty;
};

module.exports = internals;

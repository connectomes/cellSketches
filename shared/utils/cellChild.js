utils.CellChild = (function () {
    'use strict';

    function CellChild(id, parentId, label, tags, notes, type) {
        var self = this;
        self.id = id;
        self.parentId = parentId;
        self.label = label;
        self.tags = tags;
        self.notes = notes;
        self.type = type;
    }

    return CellChild;

})();
utils.CellChild = (function () {
    'use strict';

    function CellChild(id, parentId, label, tags, notes, type, confidence) {
        var self = this;
        self.id = id;
        self.parentId = parentId;
        self.label = label;
        self.tags = tags;
        self.notes = notes;
        self.type = type;
        self.confidence = confidence;
    }

    return CellChild;

})();
utils.Cell = (function () {
    'use strict';

    function Cell(id) {
        var self = this;
        self.id = parseInt(id);
        self.locationIndex = -1;
        self.label = "";
        self.tags = "";
        self.notes = "";
    }

    Cell.prototype.init = function (locationIndex, label, tags, notes) {
        var self = this;
        self.locationIndex = locationIndex;
        self.label = label;
        self.tags = tags;
        self.notes = notes;
    };

    return Cell;

})();
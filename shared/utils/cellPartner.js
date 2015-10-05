utils.CellPartner = (function () {
    'use strict';

    function CellPartner(parentId, partnerIndex) {
        var self = this;
        self.parentId = parentId; // id of the cell that this child connects to
        self.partnerIndex = partnerIndex; // child of the parent cell.
    }

    return CellPartner;

})();
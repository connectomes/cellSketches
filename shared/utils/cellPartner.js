utils.CellPartner = (function () {
    'use strict';

    // This contains a list of structures and cells linked to a given child.
    function CellPartner(parentId, partnerIndex, bidirectional) {

        var self = this;

        self.parentId = parentId;           // id of the cell that this child connects to
        self.partnerIndex = partnerIndex;   // child of the parent cell. TODO: rename this.
        self.bidirectional = bidirectional;
    }

    return CellPartner;

})();
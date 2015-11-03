utils.CellPartner = (function () {
    'use strict';

    // This contains a list of structures and cells linked to a given child.
    function CellPartner(neighborIds, childIds, bidirectional) {

        var self = this;

        self.neighborIds = neighborIds;
        self.childIds = childIds;
        self.bidirectional = bidirectional;
    }

    return CellPartner;

})();
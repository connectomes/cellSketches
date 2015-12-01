utils = utils || {};

utils.CellChildValue = (function () {
    'use strict';

    function CellChildValue(cellIndex, childIndex, partnerIndex, value){
        var self = this;
        self.cellIndex = cellIndex;
        self.childIndex = childIndex;
        self.partnerIndex = partnerIndex;
        self.value = value;
    }

    return CellChildValue;

})();

utils.SortingAlgorithms = (function () {
    'use strict';

    var self = {};

    self.sortColumnAsNumbers = function(a, b, rowA, rowB, direction) {
        if (a < b) {
            return -1;
        } else if (a == b) {
            return 0;
        } else {
            return 1;
        }
    };

    return self;

})();


utils.dataToText = (function () {
    'use strict';

    function dataToText(data) {
        var csv = '';
        data.forEach(function(e, i) {
            csv += e;
            if(i != data.length - 1) {
                csv += ', ';
            } else {
                csv += '\n';
            }
        });
        return csv;
    }

    return dataToText;

})();
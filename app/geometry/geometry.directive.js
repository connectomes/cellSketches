(function () {
    'use strict';

    angular.module('app.geometryModule')
        .directive('geometry', geometry);

    geometry.$inject = ['$log', 'volumeCells', 'volumeStructures', 'volumeHelpers', 'volumeLayers'];

    function geometry($log, volumeCells, volumeStructures, volumeHelpers, visTable, volumeLayers) {

        return {
            link: link,
            restrict: 'A',
            scope: {
                broadcastChange: '&',
                model: '=',
                selectedModeChanged: '&',
                selectedCellsChanged: '&',
                selectedChildTypesChanged: '&'
            }
        };


        function link(scope, element, attribute) {


        }


    }


})();
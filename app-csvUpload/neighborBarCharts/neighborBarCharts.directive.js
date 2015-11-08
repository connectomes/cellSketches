(function () {
    'use strict';

    angular.module('app.csvUpload')
        .directive('neighborBarChart', neighborBarChart);

    neighborBarChart.$inject = ['$log', 'volumeCells', 'volumeStructures'];

    function neighborBarChart($log, volumeCells, volumeStructures) {
        return {
            link: link,
            restrict: 'E'
        };

        function link(scope, element, attribute) {

            $log.debug('neighborBarChart - link');

            scope.$on('cellsChanged', cellsChanged);

            scope.broadcastChange();

            function cellsChanged(slot, cells, childType, useTargetLabelGroups, useOnlySelectedTargets, selectedTargets, convertToNm, useRadius) {
                $log.debug('neighborBarChart - cells changed');
                $log.debug(' cellIndexes', cells);
                $log.debug(' childType', childType);
                $log.debug(' useTargetLabelGroups', useTargetLabelGroups);
                $log.debug(' useOnlySelectedTargets', useOnlySelectedTargets);
                $log.debug(' selectedTargets', selectedTargets);
                $log.debug(' convertToNm', convertToNm);
                $log.debug(' useRadius', convertToNm);
                $log.debug(' convertToNm', useRadius);

                d3.select(element[0]).selectAll('div').remove();

                d3.select(element[0]).append('div').html('<h4>cell indexes</h4>');
                d3.select(element[0]).append('div').html(cells.ids);

                d3.select(element[0]).append('div').html('<h4>selected labels</h4>');

                if (!useOnlySelectedTargets) {
                    d3.select(element[0]).append('div').html(selectedTargets);
                } else {
                    d3.select(element[0]).append('div').html('using all targets');
                }

                d3.select(element[0]).append('div').html('<h4>selected child types</h4>');
                d3.select(element[0]).append('div').html(childType);
            }
        }
    }
})();
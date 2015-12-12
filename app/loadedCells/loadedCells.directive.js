(function () {
    'use strict';

    angular.module('app.loadedCellsModule')
        .directive('loadedCells', loadedCells);

    loadedCells.$inject = ['$log', 'loadedCellsData', 'volumeCells'];

    function loadedCells($log, loadedCellsData, volumeCells) {

        return {
            link: link,
            restrict: 'E',
            templateUrl: 'loadedCells/loadedCells.html'
        };

        function link(scope, element, attribute) {
            var self = {};

            $log.debug('neighborCells - link', scope);
            scope.$on('onLoadingCellsStarted', onLoadingCellsStarted);
            scope.$on('onInitialCellsLoaded', onInitialCellsLoaded);
            scope.$on('cellsChanged', cellsChanged);
            // scope.$on('broadcastCellLoadingStarted', onCellLoadStarted())

            var header = loadedCellsData.getHeaderData();
            scope.gridLoadedCellsOptions = {};
            scope.gridLoadedCellsOptions.columnDefs = loadedCellsData.getColumnDefs(header);
            scope.broadcastChange();

            // TODO: What if this is the second time we're loading cells?
            function onLoadingCellsStarted(slot, cellIds) {
                scope.gridLoadedCellsOptions.data = loadedCellsData.getInitialData(cellIds);
            }

            function onInitialCellsLoaded(slot, cellIds, labels, invalidCellIds) {
                $log.debug('onInitialCellsLoaded', cellIds, labels, invalidCellIds);
                loadedCellsData.updateDataStatusAndLabels(scope.gridLoadedCellsOptions.data, cellIds, labels, invalidCellIds);
            }

            function cellsChanged(slot, cells, childType, useTargetLabelGroups, useOnlySelectedTargets, selectedTargets) {
                $log.debug('loadedCells - cells changed', cells);
            }
        }

    }
})();
(function () {
    'use strict';

    angular.module('app.loadedCellsModule')
        .directive('loadedCells', loadedCells);

    loadedCells.$inject = ['$log', 'loadedCellsData', 'volumeCells'];

    function loadedCells($log, loadedCellsData, volumeCells) {

        return {
            scope: {
                model: '=',
                broadcastChange: '&'
            },
            link: link,
            restrict: 'E',
            templateUrl: 'loadedCells/loadedCells.html'
        };

        function link(scope, element, attribute) {
            var self = {};
            self.name = 'loadedCells';

            $log.debug(self.name, 'link', scope);

            scope.$on('onLoadingCellsStarted', onLoadingCellsStarted);
            scope.$on('onInitialCellsLoaded', onInitialCellsLoaded);
            scope.$on('cellsChanged', cellsChanged);
            scope.$on('reset', onReset);

            var header = loadedCellsData.getHeaderData();
            scope.gridLoadedCellsOptions = {};
            scope.gridLoadedCellsOptions.columnDefs = loadedCellsData.getColumnDefs(header);
            scope.gridLoadedCellsOptions.data = [];

            scope.broadcastChange();

            function onLoadingCellsStarted(slot, cellIds) {
                $log.debug(self.name, slot, cellIds, scope.gridLoadedCellsOptions.data);
                if (scope.gridLoadedCellsOptions.data.length == 0) {
                    scope.gridLoadedCellsOptions.data = loadedCellsData.getInitialData(cellIds);
                } else {
                    scope.gridLoadedCellsOptions.data = loadedCellsData.updateInitialData(scope.gridLoadedCellsOptions.data, cellIds);
                }

            }

            function onInitialCellsLoaded(slot, cellIds, labels, invalidCellIds) {
                $log.debug(self.name, slot, cellIds, labels, invalidCellIds);
                loadedCellsData.updateDataStatusAndLabels(scope.gridLoadedCellsOptions.data, cellIds, labels, invalidCellIds);
                loadedCellsData.updateDataRemoveErrors(scope.gridLoadedCellsOptions.data);
            }

            function cellsChanged(slot, cells, childType, useTargetLabelGroups, useOnlySelectedTargets, selectedTargets) {
                $log.debug(self.name, slot, scope);

                var cellIds = scope.model.masterCells.ids;
                if (scope.gridLoadedCellsOptions.data.length == 0 && cellIds.length > 0) {
                    var data = loadedCellsData.getInitialData(cellIds);

                    var labels = [];
                    var status = [];
                    cellIds.forEach(function (cellId) {
                        labels.push(volumeCells.getCell(cellId).label);
                        status.push(loadedCellsData.Status.OK);
                    });

                    loadedCellsData.updateDataStatusAndLabels(data, cellIds, labels, []);

                    loadedCellsData.updateDataStatus(data, cellIds, status);

                    scope.gridLoadedCellsOptions.data = data;

                } else {

                    status = [];

                    cellIds.forEach(function (cellId) {
                        status.push(loadedCellsData.Status.OK);
                    });

                    loadedCellsData.updateDataStatus(scope.gridLoadedCellsOptions.data, cellIds, status);

                }
            }

            function onReset() {
                scope.gridLoadedCellsOptions.data = [];
            }
        }

    }
})();
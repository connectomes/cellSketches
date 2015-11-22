(function () {
    'use strict';

    angular.module('app.csvUpload')
        .directive('loadedCells', loadedCells);

    loadedCells.$inject = ['$log', 'volumeCells', 'volumeStructures', 'volumeHelpers', 'visUtils', 'visTable'];

    function loadedCells($log, volumeCells, volumeStructures, volumeHelpers, visUtils, visTable) {

        return {
            link: link,
            restrict: 'E',
            templateUrl: 'loadedCells/loadedCells.html'
        };

        function link(scope, element, attribute) {
            var self = {};

            $log.debug('neighborBarChart - link', scope);
            scope.$on('cellsChanged', cellsChanged);

            scope.gridLoadedCellsOptions = {};
            scope.gridLoadedCellsOptions.columnDefs = createColumnDefs(['id', 'label'], 100);

            function cellsChanged(slot, cells, childType, useTargetLabelGroups, useOnlySelectedTargets, selectedTargets) {
                $log.debug('loadedCells - cells changed', cells);
                scope.gridLoadedCellsOptions.data = createRowData(cells.indexes);
            }
        }

        function createColumnDefs(headerData, columnWidth) {
            var columnDefs = [];
            for (var i = 0; i < headerData.length; ++i) {
                var column = {
                    field: headerData[i],
                    displayName: headerData[i]
                };

                if(i==0) {
                    column.width = 100;
                }

                columnDefs.push(column);
            }

            return columnDefs;
        }

        function createRowData(cellIndexes) {
            var data = [];
            cellIndexes.forEach(function (cellIndex, i) {
                var cell  = volumeCells.getCellAt(cellIndex);

                var rowData = {};

                rowData.id = cell.id;
                rowData.label = cell.label;

                data.push(rowData);
            });
            return data;
        }
    }
})();
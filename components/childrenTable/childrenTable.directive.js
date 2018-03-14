(function () {
    'use strict';

    angular.module('app.childrenTableModule')
        .directive('childrenTable', childrenTable);

    childrenTable.$inject = ['$log', 'childrenTableData', 'volumeCells', 'volumeHelpers'];

    function childrenTable($log, childrenTableData, volumeCells, volumeHelpers) {

        return {
            link: link,
            restrict: 'E',
            scope: {
                broadcastChange: '&'
            },
            templateUrl: 'components/childrenTable/childrenTable.directive.html'
        };

        function link(scope, element, attribute) {
            $log.debug('childrenTable - link. scope: ', scope);

            var self = {};

            scope.$on('cellsChanged', cellsChanged);
            scope.broadcastChange();

            function cellsChanged(slot, cells, childType, useTargetLabelGroups, useOnlySelectedTargets, selectedTargets, convertToNm, useRadius) {

                //var useBarsInTable = scope.model.ui.useBarsInTable;
                $log.debug('neighborBarChart - cells changed');
                $log.debug(' cellIndexes', cells);
                $log.debug(' childType', childType);
                $log.debug(' useTargetLabelGroups', useTargetLabelGroups);
                $log.debug(' useOnlySelectedTargets', useOnlySelectedTargets);
                $log.debug(' selectedTargets', selectedTargets);
                $log.debug(' convertToNm', convertToNm);
                $log.debug(' useRadius', convertToNm);
                $log.debug(' convertToNm', useRadius);

                scope.testGridOptions = {};

                var headerData = childrenTableData.getHeaderData();
                scope.testGridOptions.columnDefs = createColumnDefs(headerData, 75);

                scope.testGridOptions.data = [];
                var maxCount = 1;
                var columnWidth = 10;
                var useBarsInTable = false;
                scope.testGridOptions.data = createRowData(cells.indexes, childType, useTargetLabelGroups, maxCount, columnWidth, useBarsInTable);

                $log.debug(scope);

                function createColumnDefs(headerData, columnWidth) {
                    var columnDefs = [];
                    for (var i = 0; i < headerData.length; ++i) {
                        var column = {
                            field: headerData[i],
                            width: columnWidth,
                            displayName: headerData[i]
                        };

                        columnDefs.push(column);
                    }

                    return columnDefs;
                }


                function createRowData(cellIndexes, childType, useTargetLabelGroups, maxCount, columnWidth, useBarsInTable) {

                    var data = [];
                    data = childrenTableData.getTableData(cellIndexes);
                    return data;
                }

                /*
                 function downloadClicked() {

                 var data = [];
                 var header = [];

                 self.cells.indexes.forEach(function (cellIndex) {

                 var results = volumeHelpers.getPerChildAttrGroupedByTypeAndTarget([cellIndex], self.childType, self.useTargetLabelGroups, volumeHelpers.PerChildAttributes.CONFIDENCE, null, self.cells.indexes);
                 $log.debug(results);
                 if (header.length == 0) {

                 header.push('id');
                 header.push('label');

                 results.labels.forEach(function (label, i) {
                 var targetIndex = self.targets.indexOf(label);

                 if (targetIndex != -1) {
                 var currColumnHeader = label + ' (' + volumeStructures.getChildStructureTypeCode(results.childTypes[i]) + ')';
                 $log.debug(currColumnHeader);
                 header[i + 2] = currColumnHeader
                 }
                 });
                 $log.debug(header);
                 }

                 var rowData = [];

                 var cell = volumeCells.getCellAt(cellIndex);
                 rowData.push(cell.id);
                 rowData.push(cell.label);

                 results.valuesLists.forEach(function (values, i) {
                 var targetsIndex = self.targets.indexOf(results.labels[i]);
                 if (targetsIndex != -1) {
                 rowData[i + 2] = (values.length);
                 }
                 });

                 data.push(rowData);
                 });

                 var csv = utils.dataToText(header);

                 data.forEach(function (row) {
                 csv += utils.dataToText(row);
                 });

                 scope.saveData(csv);
                 }

                 function onCellClicked(valueList) {
                 var uniqueTargets = [];
                 var childrenPerTarget = [];
                 var numChildrenPerTarget = [];
                 valueList.forEach(function (value) {
                 var id = volumeCells.getCellNeighborIdFromChildAndPartner(value.cellIndex, value.childIndex, value.partnerIndex);
                 var child = volumeCells.getCellChildAt(value.cellIndex, value.childIndex);
                 var currIndex = uniqueTargets.indexOf(id);
                 if (currIndex == -1) {
                 uniqueTargets.push(id);
                 currIndex = uniqueTargets.length - 1;
                 childrenPerTarget[currIndex] = '';
                 childrenPerTarget[currIndex] += child.id;
                 numChildrenPerTarget[currIndex] = 1;
                 } else {
                 childrenPerTarget[currIndex] += ', ' + child.id;
                 numChildrenPerTarget[currIndex] += 1;
                 }
                 });

                 scope.gridOptions.data = [];
                 uniqueTargets.forEach(function (target, i) {
                 scope.gridOptions.data.push({
                 id: target,
                 count: numChildrenPerTarget[i],
                 children: childrenPerTarget[i]

                 });
                 });

                 scope.$apply();
                 }

                 function sortColumn(a, b, rowA, rowB, direction) {
                 var aData = a.values.length;
                 var bData = b.values.length;
                 if (aData < bData) {
                 return -1;
                 } else if (aData == bData) {
                 return 0;
                 } else {
                 return 1;
                 }
                 }

                 function updateNeighborCells(neighborId, scope) {
                 clearHighlighting(scope);
                 console.log(scope.overviewGridOptions.data);
                 var neighborCell = volumeCells.getCell(neighborId);
                 var neighborLabel = neighborCell.label;
                 for(var i=0; i<scope.overviewGridOptions.data.length; ++i) {
                 var row = scope.overviewGridOptions.data[i];
                 var cellValues = row[neighborLabel].values;
                 for(var j=0; j<cellValues.length; ++j) {
                 var value = cellValues[j];
                 var otherNeighbor = volumeCells.getCellNeighborIdFromChildAndPartner(value.cellIndex, value.childIndex, value.partnerIndex);
                 if(otherNeighbor == neighborCell.id) {
                 row[neighborLabel].highlight = true;
                 scope.highlightList.push({row: i, label: neighborLabel});
                 }
                 }
                 }
                 scope.$apply();
                 }

                 function clearHighlighting(scope) {
                 for(var i=0; i<scope.highlightList.length; ++i) {
                 var cell = scope.highlightList[i];
                 scope.overviewGridOptions.data[cell.row][cell.label].highlight = false;
                 }
                 scope.highlightList = [];
                 scope.$apply();
                 }
                 }
                 *
                 */
            }
        }

    }
})();
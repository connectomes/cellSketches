(function () {
    'use strict';

    angular.module('app.csvUpload')
        .directive('neighborTable', neighborTable);

    neighborTable.$inject = ['$log', 'volumeCells', 'volumeStructures', 'volumeHelpers', 'visUtils', 'visTable'];

    function neighborTable($log, volumeCells, volumeStructures, volumeHelpers, visUtils, visTable) {

        return {
            link: link,
            restrict: 'E'
        };

        function link(scope, element, attribute) {
            var self = {};

            $log.debug('neighborBarChart - link');

            //self.svg = visUtils.createSvg(element[0]);
            //self.mainGroup = visUtils.createMainGroup(self.svg);
            scope.$on('cellsChanged', cellsChanged);

            self.numSmallMultiplesPerRow = 6;
            self.smallMultiplePadding = 10;
            self.smallMultipleWidth = (visUtils.getSvgWidth() - (self.numSmallMultiplesPerRow * self.smallMultiplePadding)) / self.numSmallMultiplesPerRow;
            self.smallMultipleHeight = 200;
            self.smallMultipleOffsets = new utils.Point2D(self.smallMultiplePadding + self.smallMultipleWidth, self.smallMultiplePadding + self.smallMultipleHeight);
            scope.broadcastChange();
            addDownloadButton();

            /**
             * @name addDownLoadButton
             * @desc adds a download button to the div id #sidebar.
             */
            function addDownloadButton() {
                d3.select('#sidebar')
                    .append('html')
                    .html('<hr>' +
                    '<button>Download</button>')
                    .on('click', downloadClicked);
            }

            function cellsChanged(slot, cells, childType, useTargetLabelGroups, useOnlySelectedTargets, selectedTargets, convertToNm, useRadius) {
                var useBarsInTable = scope.model.ui.useBarsInTable;
                $log.debug('neighborBarChart - cells changed');
                $log.debug(' cellIndexes', cells);
                $log.debug(' childType', childType);
                $log.debug(' useTargetLabelGroups', useTargetLabelGroups);
                $log.debug(' useOnlySelectedTargets', useOnlySelectedTargets);
                $log.debug(' selectedTargets', selectedTargets);
                $log.debug(' convertToNm', convertToNm);
                $log.debug(' useRadius', convertToNm);
                $log.debug(' convertToNm', useRadius);
                $log.debug(' useBarsInTable', useBarsInTable);

                // Copy to member variables
                self.cells = cells;
                self.childType = childType;
                self.useTargetLabelGroups = useTargetLabelGroups;
                self.useOnlySelectedTargets = useOnlySelectedTargets;
                self.selectedTargets = selectedTargets;
                var cellIndexes = cells.indexes;

                // Create column defs from targets.
                var targets = volumeHelpers.getCellChildTargets(cellIndexes, childType, useTargetLabelGroups, useOnlySelectedTargets, selectedTargets);
                self.targets = targets;
                var headerData = ['id', 'label'];
                headerData = headerData.concat(targets);
                var columnWidth = 100;
                var columnDefs = createColumnDefs(headerData, columnWidth);

                // Create overview grid options
                scope.overviewGridOptions = {};
                scope.overviewGridOptions.columnDefs = columnDefs;
                scope.overviewGridOptions.multiSelect = false;
                scope.overviewGridOptions.data = [];
                scope.highlightList = [];
                // Register API for interaction.
                scope.overviewGridOptions.onRegisterApi = function (gridApi) {
                    scope.gridApi = gridApi;

                    gridApi.cellNav.on.navigate(scope, function (newRowCol, oldRowCol) {
                        var nameOfColumn = newRowCol.col.colDef.name;
                        var values = newRowCol.row.entity[nameOfColumn].values;
                        clearHighlighting(scope);
                        onCellClicked(values);
                    });
                };

                // Find min and max values
                var results = volumeHelpers.getMinMaxCount(cellIndexes, childType, targets, useTargetLabelGroups);
                var maxCount = results.maxCount;

                // Create row data.
                scope.overviewGridOptions.data = createRowData(cellIndexes, childType, useTargetLabelGroups, maxCount, columnWidth, useBarsInTable);

                // Done with the overview table. Now create the details table.
                createDetailsTable(scope);

                //createDebuggingElements(cells, useOnlySelectedTargets, selectedTargets, childType);
            }

            function createDebuggingElements(cells, useTargetLabelGroups, useOnlySelectedTargets, selectedTargets, childType) {
                d3.select(element[0]).selectAll('div').remove();

                d3.select(element[0]).append('div').html('<h4>cell indexes</h4>');
                d3.select(element[0]).append('div').html(cells.ids);

                d3.select(element[0]).append('div').html('<h4>selected labels</h4>');

                if (!useOnlySelectedTargets) {
                    d3.select(element[0]).append('div').html(selectedTargets);
                } else {
                    d3.select(element[0]).append('div').html('using all targets');
                }

                d3.select(element[0]).append('div').html('<h4>select e d child types</h4>');
                d3.select(element[0]).append('div').html(childType);

                var cellIndexes = cells.indexes;
                var targets = volumeHelpers.getAggregateChildTargetNames(cellIndexes, childType, useTargetLabelGroups);
                d3.select(element[0]).append('div').html('<h4>all targets</h4>');
                d3.select(element[0]).append('div').html(targets);

                cellIndexes.forEach(function (cellIndex) {
                    var results = volumeHelpers.getAggregateChildAttrGroupedByTarget([cellIndex], childType, useTargetLabelGroups, volumeHelpers.PerChildAttributes.CONFIDENCE, null, cellIndexes);
                    d3.select(element[0]).append('div').html('<h4>results</h4>');
                    d3.select(element[0]).append('div')
                        .selectAll('body').data(results.valuesLists[0]).enter().append('p').text(function (d) {
                            return d.cellIndex + ', ' + d.childIndex + ', ' + d.value;
                        });
                });
            }

            function createDetailsTable(scope) {
                // Create the details grid.
                scope.gridOptions = {};
                scope.gridOptions.enableFullRowSelection = true;
                scope.gridOptions.multiSelect = false;
                scope.gridOptions.columnDefs = [{
                    field: 'id',
                    displayName: 'id',
                    width: 75
                }, {
                    field: 'count',
                    displayName: 'count',
                    width: 75
                }, {
                    field: 'children',
                    displayName: 'children'
                }];

                scope.gridOptions.onRegisterApi = function (gridApi) {
                    scope.gridApi = gridApi;
                    gridApi.selection.on.rowSelectionChanged(scope, function (row) {
                        updateNeighborCells(row.entity.id, scope);
                    });
                };
            }

            function createColumnDefs(headerData, columnWidth) {
                var columnDefs = [];
                for (var i = 0; i < headerData.length; ++i) {
                    var column = {
                        field: headerData[i],
                        width: columnWidth,
                        displayName: headerData[i]
                    };

                    if (i > 1) {
                        column.cellTemplate = 'neighborTable/neighborTableCell.html';
                        column.sortingAlgorithm = sortColumn;
                    } else {
                        column.allowCellFocus = false;
                    }

                    columnDefs.push(column);
                }

                return columnDefs;
            }

            function createRowData(cellIndexes, childType, useTargetLabelGroups, maxCount, columnWidth, useBarsInTable) {
                var data = [];
                cellIndexes.forEach(function (cellIndex) {
                    var results = volumeHelpers.getAggregateChildAttrGroupedByTarget([cellIndex], childType, useTargetLabelGroups, volumeHelpers.PerChildAttributes.CONFIDENCE, null, cellIndexes);
                    var rowData = {};
                    rowData.id = volumeCells.getCellAt(cellIndex).id;
                    rowData.label = volumeCells.getCellAt(cellIndex).label;

                    results.valuesLists.forEach(function (values, i) {
                        var currTarget = results.labels[i];
                        rowData[currTarget] = {
                            values: values,
                            fraction: (values.length / maxCount),
                            width: columnWidth,
                            showText: !useBarsInTable,
                            highlight: false
                        };
                    });
                    data.push(rowData);
                });
                return data;
            }

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
    }
})();
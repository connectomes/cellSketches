(function () {
    'use strict';

    angular.module('app.csvUpload')
        .directive('neighborChart', neighborChart);

    neighborChart.$inject = ['$log', 'volumeCells', 'volumeStructures', 'volumeHelpers', 'visUtils', 'visBarChart'];

    function neighborChart($log, volumeCells, volumeStructures, volumeHelpers, visUtils, visBarChart) {

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

            self.numSmallMultiplesPerRow = 3;
            self.smallMultiplePadding = 10;
            self.smallMultipleWidth = (visUtils.getSvgWidth() - (self.numSmallMultiplesPerRow * self.smallMultiplePadding)) / self.numSmallMultiplesPerRow;
            self.smallMultipleHeight = 300;
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
                self.cells = cells;
                self.childType = childType;
                self.useTargetLabelGroups = useTargetLabelGroups;
                self.useOnlySelectedTargets = useOnlySelectedTargets;
                self.selectedTargets = selectedTargets;

                scope.model.ui.details.cellId = -1;
                scope.model.ui.details.target = '';

                // Get list of targets. These will be bars in the small multiples.
                var cellIndexes = cells.indexes;
                var targets = volumeHelpers.getCellChildTargets(cellIndexes, childType, useTargetLabelGroups, useOnlySelectedTargets, selectedTargets);
                self.targets = targets;

                // Get min and max count of children. These will be used to scale the bars.
                var results = volumeHelpers.getMinMaxCount(cellIndexes, childType, targets, useTargetLabelGroups);
                var maxCount = results.maxCount;
                $log.debug('maxCount', maxCount);

                // Create the chart data.
                var chartData = createChartData(cellIndexes, childType, useTargetLabelGroups, maxCount, onBarClicked);
                $log.debug('chartData', chartData);

                // Create the main group to hold all the charts
                // Total height: numRows * heightPerRow
                // numRows = numSmallMultiples / smallMultiplesPerRow
                var svgWidth = visUtils.getSvgWidth();
                var numRows = cellIndexes.length / self.numSmallMultiplesPerRow;
                var svgHeight = Math.ceil(numRows) * self.smallMultipleHeight + self.smallMultiplePadding * 2;

                if (!self.mainGroup) {
                    self.mainGroup = d3.select(element[0])
                        .append('svg')
                        .attr('width', svgWidth)
                        .attr('height', svgHeight);
                }
                visUtils.clearGroup(self.mainGroup);

                self.mainGroup.on('click', function () {
                    clearHighlighting();
                });

                // foreach element in chart data
                var offsets = new utils.Point2D(self.smallMultipleWidth, self.smallMultipleHeight);
                for (var i = 0; i < cellIndexes.length; ++i) {
                    var positionInGrid = visUtils.computeGridPosition(i, self.numSmallMultiplesPerRow);
                    var position = positionInGrid.multiply(offsets);
                    var totalPadding = positionInGrid.multiply(new utils.Point2D(self.smallMultiplePadding, self.smallMultiplePadding));
                    position = position.add(totalPadding);
                    $log.debug(position.toString());
                    var group = self.mainGroup.append('g')
                        .attr('transform', 'translate' + position.toString());

                    //visUtils.addOutlineToGroup(group, self.smallMultipleWidth, self.smallMultipleHeight);

                    var chart = new visBarChart.BarChartD3();
                    chart.activate(group, cells.ids[i], self.smallMultipleWidth, self.smallMultipleHeight, targets, chartData[i], maxCount, onBarClicked);

                }

                // create details table below the bar charts
                createDetailsTable(scope);
                //createDebuggingElements(cells, useTargetLabelGroups, useOnlySelectedTargets, selectedTargets, childType);
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

                d3.select(element[0]).append('div').html('<h4>selected child types</h4>');
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

            function createChartData(cellIndexes, childType, useTargetLabelGroups, maxCount, columnWidth, useBarsInTable) {
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

                /*
                 clearHighlighting(scope);


                 var neighborCell = volumeCells.getCell(neighborId);
                 var neighborLabel = neighborCell.label;
                 for (var i = 0; i < scope.overviewGridOptions.data.length; ++i) {
                 var row = scope.overviewGridOptions.data[i];
                 var cellValues = row[neighborLabel].values;
                 for (var j = 0; j < cellValues.length; ++j) {
                 var value = cellValues[j];
                 var otherNeighbor = volumeCells.getCellNeighborIdFromChildAndPartner(value.cellIndex, value.childIndex, value.partnerIndex);
                 if (otherNeighbor == neighborCell.id) {
                 row[neighborLabel].highlight = true;
                 scope.highlightList.push({row: i, label: neighborLabel});
                 }
                 }
                 }
                 scope.$apply();
                 */
            }

            function clearHighlighting() {

                d3.selectAll('.bar')
                    .style('fill', '');

                scope.model.ui.details.cellId = -1;
                scope.model.ui.details.target = '';
                scope.$apply();
            }

            function onBarClicked(d) {

                clearHighlighting();

                console.log(d);

                scope.model.ui.details.cellId = d.cellId;
                scope.model.ui.details.target = d.name;

                d3.select(this)
                    .style('fill', '#FF6400');

                d3.event.stopPropagation();

                onCellClicked(d.values.values);

            }
        }
    }
})();
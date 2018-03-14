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

        /**
         * @name link for neighbor chart directive
         * @param scope
         * @param element
         * @param attribute
         * @desc creates bar charts for all of the selected cells!
         *
         * Chains of interaction:
         * 1. Bar click
         *      onBarClicked
         *          calls onSelectionCleared
         *          updates color of clicked bar
         *          calls populateDetailsTableFromSelection
         *
         * 2. Details row hovered
         *      onDetailsRowHovered -> onHighlightBarsWithCommonNeighbors or onHighlightingCleared
         *
         * 3. User clicks on svg -> onSelectionCleared
         */
        function link(scope, element, attribute) {
            var self = {};

            $log.debug('neighborBarChart - link');

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
                self.useOnlySelectedTargets = !useOnlySelectedTargets; //TODO: this should be switched
                self.selectedTargets = selectedTargets;

                scope.model.ui.details.cellId = -1;
                scope.model.ui.details.target = '';

                // Get list of targets. These will be bars in the small multiples.
                var cellIndexes = cells.indexes;
                var targets = volumeHelpers.getCellChildTargets(cellIndexes, childType, useTargetLabelGroups, !useOnlySelectedTargets, selectedTargets);
                self.targets = targets;

                // Get min and max count of children. These will be used to scale the bars.
                var results = volumeHelpers.getMinMaxCount(cellIndexes, childType, targets, useTargetLabelGroups);
                var maxCount = results.maxCount;

                // Create the chart data.
                var chartData = createChartData(cellIndexes, childType, useTargetLabelGroups, maxCount, onBarClicked);

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

                self.mainGroup.on('click', onSelectionCleared);

                var offsets = new utils.Point2D(self.smallMultipleWidth, self.smallMultipleHeight);

                // Create individual bar charts!
                for (var i = 0; i < cellIndexes.length; ++i) {
                    var positionInGrid = visUtils.computeGridPosition(i, self.numSmallMultiplesPerRow);
                    var position = positionInGrid.multiply(offsets);
                    var totalPadding = positionInGrid.multiply(new utils.Point2D(self.smallMultiplePadding, self.smallMultiplePadding));
                    position = position.add(totalPadding);

                    var group = self.mainGroup.append('g')
                        .attr('transform', 'translate' + position.toString());

                    var chart = new visBarChart.BarChartD3();

                    chart.activate(group, cells.ids[i], self.smallMultipleWidth, self.smallMultipleHeight, targets, chartData[i], maxCount, onBarClicked);

                }

                createDetailsTable(scope);
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

                scope.gridOptions.rowTemplate = 'components/common/rowTemplate.html';

                scope.mouseOverDetailsRow = onDetailsRowHovered;
            }

            function createChartData(cellIndexes, childType, useTargetLabelGroups, maxCount) {
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

            function onBarClicked(d) {

                onSelectionCleared();

                console.log(d);

                scope.model.ui.details.cellId = d.cellId;
                scope.model.ui.details.target = d.name;

                d3.select(this)
                    .style('fill', '#FF6400');

                d3.event.stopPropagation();

                populateDetailsTableFromClickedCell(d.values.values);

            }

            function onDetailsRowHovered(column, rowScope, mouseOver) {
                if (mouseOver) {
                    onHighlightCellsWithCommonNeighbors(rowScope.$parent.row.entity.id, scope);
                } else {
                    onHighlightingCleared();
                }
            }

            function onHighlightCellsWithCommonNeighbors(neighborId, scope) {

                // All of the bars being rendered.
                var bars = d3.selectAll('.bar');

                // Find bars only with common neighbors.
                var barsWithCommonNeighbor = bars.filter(function (d, i) {

                    var values = d.values.values;

                    // Do not change the color of the bar that the user clicked on.
                    if (d.cellId == scope.model.ui.details.cellId) {
                        return false;
                    }

                    // Check for neighbors equal to what the user has moused over.
                    for (var j = 0; j < values.length; ++j) {
                        var value = values[j];

                        var otherNeighbor = volumeCells.getCellNeighborIdFromChildAndPartner(value.cellIndex,
                            value.childIndex, value.partnerIndex);

                        if (neighborId == otherNeighbor) {
                            return true;
                        }

                    }

                    return false;
                });

                // Update highlighting.
                barsWithCommonNeighbor.style('fill', '#FFC800');

            }

            function onHighlightingCleared() {
                // Remove highlighting from bars except what the user already clicked on!
                d3.selectAll('.bar').filter(function (d) {
                    return d.cellId != scope.model.ui.details.cellId;
                }).style('fill', '');
            }

            function onSelectionCleared() {

                d3.selectAll('.bar')
                    .style('fill', '');

                scope.model.ui.details.cellId = -1;
                scope.model.ui.details.target = '';
                scope.$apply();
            }

            function populateDetailsTableFromClickedCell(valueList) {
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

        }
    }
})();
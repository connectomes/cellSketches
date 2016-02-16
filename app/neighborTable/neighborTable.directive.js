(function () {
    'use strict';

    angular.module('app.neighborTableModule')
        .directive('neighborTable', neighborTable);

    neighborTable.$inject = ['$log', 'volumeCells', 'volumeStructures', 'volumeHelpers', 'visUtils', 'visTable', 'neighborTableData'];

    function neighborTable($log, volumeCells, volumeStructures, volumeHelpers, visUtils, visTable, neighborTableData) {

        return {
            link: link,
            restrict: 'E',
            templateUrl: 'neighborTable/neighborTable.directive.html',
            scope: {
                broadcastChange: '&',
                model: '=',
                selectedModeChanged: '&',
                selectedCellsChanged: '&',
                selectedChildTypesChanged: '&'
            }
        };

        /**
         * @desc - interaction that this sets up.
         * 1. User clicks on cell in overview table
         *      onOverViewCellClicked ->
         *          onHighlightingCleared
         *          populateDetailsTableFromClickedCell
         *          Update scope.model.ui.details.
         *
         * 2. User hovers over details row
         *      onDetailsRowHovered ->
         *          onHighlightCellsWithCommonNeighbors
         *          onHighlightingCleared
         *          Update scope.highlightList
         *          Update row[neighborLabel].highlight - cell directives watch this value
         *
         *  3. User moves mouse away from details row
         *      onDetailsRowHovered ->
         *          onHighlightingCleared
         *
         */
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

            // Data is either attribute or count
            scope.DataModes = [
                {
                    name: 'Count',
                    id: 0
                },
                {
                    name: 'Attribute (histogram)',
                    id: 1
                }
            ];

            // Count encoding is either bar or text
            scope.CountEncodingModes = [
                {
                    name: 'Bars',
                    id: 0
                },
                {
                    name: 'Text',
                    id: 1
                }
            ];

            // Attributes are either distance or diameter
            scope.AttributeModes = [
                {
                    name: 'Distance',
                    id: volumeHelpers.PerChildAttributes.DISTANCE
                },
                {
                    name: 'Diameter',
                    id: volumeHelpers.PerChildAttributes.DIAMETER
                }
            ];

            scope.UnitModes = [
                {
                    name: 'px',
                    id: volumeHelpers.Units.PIXELS
                },
                {
                    name: 'nm',
                    id: volumeHelpers.Units.NM
                }
            ];

            scope.model.ui.modes = {};
            scope.model.ui.modes.selectedDataMode = scope.DataModes[1];
            scope.model.ui.modes.selectedCountMode = scope.CountEncodingModes[0];
            scope.model.ui.modes.selectedAttributeMode = scope.AttributeModes[0];
            scope.model.ui.modes.selectedUnitMode = scope.UnitModes[1];
            scope.overviewGridOptions = {};

            scope.onDownloadClicked = onDownloadClicked;
            scope.broadcastChange();

            function cellsChanged(slot, cells, childType, useTargetLabelGroups, useOnlySelectedTargets, selectedTargets, convertToNm, useRadius) {

                scope.model.ui.details.cellId = -1;
                scope.model.ui.useBarsInTable = scope.model.ui.modes.selectedCountMode.name == "Bars";

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
                self.useTargetLabelGroups = useTargetLabelGroups;
                self.useOnlySelectedTargets = !useOnlySelectedTargets; // TODO: This is flipped.
                self.selectedTargets = selectedTargets;

                var selectedAttribute = undefined;
                if (scope.model.ui.modes.selectedDataMode.name == 'Attribute (histogram)') {
                    selectedAttribute = scope.model.ui.modes.selectedAttributeMode.id;
                }

                var cellIndexes = cells.indexes;

                // Create column defs from targets.
                var childrenGrouping = scope.model.ui.selectedMode.value;
                if (childrenGrouping == neighborTableData.Grouping.CHILDTYPE) {
                    self.childType = undefined;
                } else {
                    self.childType = childType;
                }
                var headerData = neighborTableData.getHeaderData(cellIndexes, self.childType, useTargetLabelGroups, self.useOnlySelectedTargets, selectedTargets, childrenGrouping);

                self.targets = headerData.slice(2);

                var columnWidth = 100;
                var columnDefs = neighborTableData.getColumnDefs(headerData, sortColumn, selectedAttribute);

                // Create overview grid options. Here we want to keep the old grid options - this is because the old
                // grid options have some internal state that needs to be preserved.
                angular.extend(scope.overviewGridOptions, neighborTableData.getDefaultGridOptions(selectedAttribute));

                // Update the columns and data.
                scope.overviewGridOptions.columnDefs = columnDefs;
                scope.overviewGridOptions.data = [];
                scope.highlightList = [];

                // Register API for interaction.
                scope.overviewGridOptions.onRegisterApi = function (gridApi) {
                    scope.gridApi = gridApi;
                    gridApi.cellNav.on.navigate(scope, onOverviewCellClicked);
                };

                scope.overviewGridSettings = {};
                scope.overviewGridSettings.selectedAttribute = selectedAttribute;
                scope.overviewGridSettings.selectedGrouping = childrenGrouping;
                scope.overviewGridSettings.selectedUnits = scope.model.ui.modes.selectedUnitMode.id;
                // Max count is used by the bars to fill appropriately.
                scope.overviewGridOptions.data = neighborTableData.getTableData(cellIndexes, self.childType, useTargetLabelGroups, self.useOnlySelectedTargets, self.selectedTargets, childrenGrouping, 0, columnWidth, 0, selectedAttribute,
                    scope.overviewGridSettings.selectedUnits);
                scope.maxCount = neighborTableData.getTableDataMaxValue(headerData, scope.overviewGridOptions.data, selectedAttribute);

                var numBins = 10;
                scope.histogram = {
                    numBins: numBins,
                    xAxisDomain: [0, scope.maxCount],
                    xAxisRange: [0, neighborTableData.histogramRowWidth]
                };
                var maxYValue = neighborTableData.getHistogramMaxYValueFromTable(scope.overviewGridOptions.data, headerData, numBins, scope.histogram.xAxisDomain, scope.histogram.xAxisRange);
                scope.histogram.yAxisDomain = [0, maxYValue];

                // Done with the overview table. Now create the details table.
                createDetailsTable(scope, childrenGrouping, selectedAttribute);

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

            function createDetailsTable(scope, grouping, attribute) {

                // Create the details grid.
                scope.gridOptions = scope.gridOptions || {};
                scope.gridOptions = angular.extend(scope.gridOptions, neighborTableData.getDetailsGridOptions(grouping, attribute));

                scope.gridOptions.columnDefs = neighborTableData.getDetailsColumnDefs(grouping, attribute, scope.overviewGridSettings.selectedUnits);
                scope.gridOptions.data = [];
                scope.mouseOverDetailsRow = onDetailsRowHovered;

                scope.gridOptions.onRegisterApi = function (gridApi) {
                    console.log('register api');
                    scope.detailGridApi = gridApi;
                    gridApi.edit.on.afterCellEdit(scope, function (rowEntity, colDef, newValue, oldValue) {

                        rowEntity[colDef.field] = oldValue;
                        scope.$apply();
                    });
                };
            }

            function onDownloadClicked() {

                var csv = '';
                if (scope.model.ui.modes.selectedDataMode.name == 'Attribute (histogram)') {
                    csv = neighborTableData.getTableAsCsvOfChildren(self.cells.indexes, self.childType, self.useTargetLabelGroups, self.useOnlySelectedTargets, self.selectedTargets, scope.overviewGridSettings.selectedGrouping);
                } else {
                    csv = neighborTableData.getTableAsCsv(self.cells.indexes, self.childType, self.useTargetLabelGroups, self.useOnlySelectedTargets, self.selectedTargets, scope.overviewGridSettings.selectedGrouping);
                }

                var blob = new Blob([csv], {type: "text"});
                saveAs(blob, 'data.csv');
            }

            function onDetailsRowHovered(column, rowScope, mouseOver) {
                /*return;
                 if (mouseOver) {
                 onHighlightCellsWithCommonNeighbors(rowScope.$parent.row.entity.targetId, scope);
                 } else {
                 onHighlightingCleared(scope);
                 }
                 */
            }

            function onHighlightCellsWithCommonNeighbors(neighborId, scope) {

                onHighlightingCleared(scope);

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
            }

            function onHighlightingCleared(scope) {
                for (var i = 0; i < scope.highlightList.length; ++i) {
                    var cell = scope.highlightList[i];
                    scope.overviewGridOptions.data[cell.row][cell.label].highlight = false;
                }
                scope.highlightList = [];
            }

            function onOverviewCellClicked(newRowCol, oldRowCol) {
                var nameOfColumn = newRowCol.col.colDef.name;
                var values = newRowCol.row.entity[nameOfColumn].values;
                onHighlightingCleared(scope);
                populateDetailsTableFromClickedCell(values);

                scope.model.ui.details.cellId = newRowCol.row.entity['id'];
                scope.model.ui.details.target = nameOfColumn;

                // The selectedChildTypes are displayed in the header above the details table. Here, we update it only
                // if we're using the a specific child type (in other words, if the display more is 'grouped by target')
                if (self.childType) {

                    var selectedChildTypes = '';
                    for (var i = 0; i < self.childType.length; ++i) {
                        if (i > 0) {
                            selectedChildTypes += ', ';
                        }
                        selectedChildTypes += volumeStructures.getChildStructureTypeCode(self.childType[i]);
                    }

                    scope.model.ui.details.selectedChildTypes = selectedChildTypes;
                }

            }

            function populateDetailsTableFromClickedCell(valueList) {

                scope.gridOptions.data = neighborTableData.getDetailsData(scope.overviewGridSettings.selectedAttribute,
                    scope.overviewGridSettings.selectedGrouping, valueList);

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

        }
    }


})();
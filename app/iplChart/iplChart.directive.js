(function () {
    'use strict';

    angular.module('app.iplChartModule')
        .directive('iplChart', iplChart);

    iplChart.$inject = ['$log', 'volumeCells', 'volumeStructures', 'volumeHelpers', 'visUtils', 'visTable', 'iplChartData', 'volumeLayers'];

    function iplChart($log, volumeCells, volumeStructures, volumeHelpers, visUtils, visTable, iplChartData, volumeLayers) {

        return {
            link: link,
            restrict: 'E',
            templateUrl: 'iplChart/iplChart.directive.html',
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
            scope.toggle = true;
            var self = {};

            $log.debug('iplChart - link');

            //self.svg = visUtils.createSvg(element[0]);
            //self.mainGroup = visUtils.createMainGroup(self.svg);
            scope.$on('cellsChanged', cellsChanged);

            self.numSmallMultiplesPerRow = 4;
            self.smallMultiplePadding = 10;
            self.smallMultipleWidth = (visUtils.getSvgWidth() - (self.numSmallMultiplesPerRow * self.smallMultiplePadding)) / self.numSmallMultiplesPerRow;
            self.smallMultipleHeight = 250;
            self.cachedRadius == -1;
            scope.model.ui.numBinOptions = [25, 30, 35, 40, 45, 50];
            scope.model.ui.numBins = 25;

            scope.IplModes = [{
                name: "Depth",
                value: iplChartData.IplModes.DEPTH
            }, {
                name: "IPL",
                value: iplChartData.IplModes.IPL
            }];

            scope.SearchRadiusModes = [{
                name: "Tiny",
                value: 1
            }, {
                name: "Small",
                value: 15000
            }, {
                name: "Medium",
                value: 30000
            }, {
                name: "Large",
                value: 45000
            }];

            scope.model.ui.selectedSearchRadiusMode = scope.SearchRadiusModes[1];
            scope.model.ui.selectedIplMode = scope.IplModes[0];
            scope.onIplChartDownloadClicked = onDownloadClicked;

            scope.broadcastChange();

            function cellsChanged(slot, cells, childType, useTargetLabelGroups, useOnlySelectedTargets, selectedTargets, convertToNm, useRadius) {
                $log.debug('iplChart - cellsChanged', scope);

                volumeLayers.setSearchRadius(scope.model.ui.selectedSearchRadiusMode.value);

                var cachedOk = false;
                var chartData = [];

                // Only used cache data if radius has not changed.
                if (self.cachedRadius == scope.model.ui.selectedSearchRadiusMode.value &&
                    self.cachedIplMode == scope.model.ui.selectedIplMode.value) {

                    // Check that we have all the cell ids cached
                    var allCellsCached = true;
                    cells.ids.forEach(function (cellId) {
                            if (self.cachedIds.indexOf(cellId) == -1) {
                                allCellsCached = false;
                            }
                        }
                    );

                    // If we have all the cells cached, then we can retrieve the values
                    if (allCellsCached) {
                        cachedOk = true;
                        cells.ids.forEach(function (cellId) {
                            var cachedIndex = self.cachedIds.indexOf(cellId);
                            chartData.push(self.cachedData[cachedIndex]);
                        })
                    }

                }

                if (!cachedOk) {
                    chartData = iplChartData.getIplChartData(cells.indexes, scope.model.ui.selectedIplMode.value);
                }

                scope.model.ui.details.cellId = -1;
                scope.cellIds = cells.ids;
                scope.cellIndexes = cells.indexes;
                scope.smallMultipleWidth = self.smallMultipleWidth;
                scope.smallMultipleHeight = self.smallMultipleHeight;
                scope.yAxisDomain = iplChartData.getIplRange(chartData);

                scope.yAxisRange = [0, self.smallMultipleHeight * (6.0 / 8.0)];
                scope.xAxisDomain = [0, iplChartData.getHistogramMaxItemsInBins(chartData, scope.model.ui.numBins, scope.yAxisDomain, scope.yAxisRange)];
                scope.xAxisRange = [0, self.smallMultipleWidth * (6.0 / 8.0)];
                scope.chartData = chartData;

                scope.numBins = scope.model.ui.numBins;
                // This is the watched variable to redraw
                scope.toggle = !scope.toggle;

                // Only update the cache if we had to recompute some new values.
                if (!cachedOk) {
                    self.cachedRadius = scope.model.ui.selectedSearchRadiusMode.value;
                    self.cachedData = chartData;
                    self.cachedIds = cells.ids;
                    self.cachedIplMode = scope.model.ui.selectedIplMode.value;
                }
            }

            function onDownloadClicked() {

                var csv = '';
                var chartData = iplChartData.getIplChartData(scope.cellIndexes, scope.model.ui.selectedIplMode.value);
                csv += iplChartData.getAsCsv(scope.cellIndexes, chartData);
                var blob = new Blob([csv], {type: "text"});
                saveAs(blob, 'data.csv');

            }

        }


    }


})();
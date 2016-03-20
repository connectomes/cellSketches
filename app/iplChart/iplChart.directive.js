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
            scope.model.ui.numBinOptions = [25, 30, 35, 40, 45, 50];
            scope.model.ui.numTickOptions = [0, 3, 5];
            scope.model.ui.numTicks = 0;
            scope.model.ui.numBins = 25;

            // Units shown along the vertical axis.
            scope.VerticalAxisModes = [{
                name: "Depth",
                value: iplChartData.VerticalAxisModes.DEPTH
            }, {
                name: "Normalized depth",
                value: iplChartData.VerticalAxisModes.NORMALIZED_DEPTH
            }, {
                name: "Percent difference",
                value: iplChartData.VerticalAxisModes.PERCENT_DIFFERENCE
            }];

            // How will we search for the intersection point with the different boundary layers?
            // Average will do wt. avg
            // Mesh will do ray casting.
            scope.SearchModes = [{
                name: "Average",
                value: 0
            }, {
                name: "Mesh",
                value: 1
            }];

            // Search radii used in wt average of boundary positions
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

            // Set initial modes for the ui.
            scope.model.ui.selectedSearchMode = scope.SearchModes[1];
            scope.model.ui.selectedSearchRadiusMode = scope.SearchRadiusModes[1];
            scope.model.ui.selectedVerticalAxisMode = scope.VerticalAxisModes[0];

            // Connect up buttons
            scope.onIplChartDownloadClicked = onDownloadClicked;

            scope.broadcastChange();
            scope.hoverIndex = undefined;

            scope.onUpdateHover = function(i) {
                scope.$apply(scope.hoverIndex = i);
            };
            function cellsChanged(slot, cells) {

                var chartData = iplChartData.getIplChartData(cells.indexes, scope.model.ui.selectedVerticalAxisMode.value, scope.model.ui.selectedSearchMode.value, scope.model.ui.selectedSearchRadiusMode.value);

                scope.model.ui.details.cellId = -1;
                scope.cellIds = cells.ids;
                scope.cellIndexes = cells.indexes;

                scope.cellLabels = [];
                for (var i = 0; i < scope.cellIndexes.length; ++i) {
                    scope.cellLabels.push(volumeCells.getCellAt(scope.cellIndexes[i]).label);
                }

                scope.smallMultipleWidth = self.smallMultipleWidth;
                scope.smallMultipleHeight = self.smallMultipleHeight;
                scope.yAxisDomain = iplChartData.getIplRange(chartData);

                scope.yAxisRange = [0, self.smallMultipleHeight * (6.0 / 8.0)];
                scope.xAxisDomain = [0, iplChartData.getHistogramMaxItemsInBins(chartData, scope.model.ui.numBins, scope.yAxisDomain, scope.yAxisRange)];
                scope.xAxisRange = [0, self.smallMultipleWidth * (6.0 / 8.0)];
                scope.chartData = chartData;

                scope.numBins = scope.model.ui.numBins;
                scope.numTicks = scope.model.ui.numTicks;

                // This is the watched variable to redraw
                scope.toggle = !scope.toggle;
            }

            function onDownloadClicked() {
                var csv = '';
                var chartData = iplChartData.getIplChartData(scope.cellIndexes, scope.model.ui.selectedVerticalAxisMode.value);
                csv += iplChartData.getAsCsv(scope.cellIndexes, chartData);
                var blob = new Blob([csv], {type: "text"});
                saveAs(blob, 'data.csv');
            }

        }


    }


})();
(function () {
    'use strict';

    angular.module('app.iplChartModule')
        .directive('iplChart', iplChart);

    iplChart.$inject = ['$log', 'volumeCells', 'volumeStructures', 'volumeHelpers', 'visUtils', 'visTable', 'iplChartData'];

    function iplChart($log, volumeCells, volumeStructures, volumeHelpers, visUtils, visTable, iplChartData) {

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

            var self = {};

            $log.debug('iplChart - link');

            //self.svg = visUtils.createSvg(element[0]);
            //self.mainGroup = visUtils.createMainGroup(self.svg);
            scope.$on('cellsChanged', cellsChanged);

            self.numSmallMultiplesPerRow = 4;
            self.smallMultiplePadding = 10;
            self.smallMultipleWidth = (visUtils.getSvgWidth() - (self.numSmallMultiplesPerRow * self.smallMultiplePadding)) / self.numSmallMultiplesPerRow;
            self.smallMultipleHeight = 250;

            scope.model.ui.numBinOptions = [25, 50];
            scope.model.ui.numBins = 25;

            scope.broadcastChange();


            function cellsChanged(slot, cells, childType, useTargetLabelGroups, useOnlySelectedTargets, selectedTargets, convertToNm, useRadius) {
                $log.debug('iplChart - cellsChanged');
                $log.debug(scope);
                scope.model.ui.details.cellId = -1;
                scope.cellIds = cells.ids;
                scope.cellIndexes = cells.indexes;
                scope.smallMultipleWidth = self.smallMultipleWidth;
                scope.smallMultipleHeight = self.smallMultipleHeight;
                var chartData = iplChartData.getIplChartData(scope.cellIndexes);

                scope.yAxisDomain = iplChartData.getIplRange(chartData);
                scope.yAxisRange = [0, self.smallMultipleHeight];
                scope.xAxisDomain = [0, iplChartData.getHistogramMaxItemsInBins(chartData, scope.model.ui.numBins, scope.yAxisDomain, scope.yAxisRange)];
                scope.xAxisRange = [0, self.smallMultipleWidth];
                scope.chartData = chartData;
                $log.error('setting num bins', scope.model.ui.numBins);
                scope.numBins = scope.model.ui.numBins;
            }
        }
    }


})();
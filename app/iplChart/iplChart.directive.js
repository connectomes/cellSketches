(function () {
    'use strict';

    angular.module('app.iplChartModule')
        .directive('iplChart', iplChart);

    iplChart.$inject = ['$log', 'volumeCells', 'volumeStructures', 'volumeHelpers', 'visUtils', 'visTable', 'neighborTableData'];

    function iplChart($log, volumeCells, volumeStructures, volumeHelpers, visUtils, visTable, neighborTableData) {

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

            self.numSmallMultiplesPerRow = 3;
            self.smallMultiplePadding = 10;
            self.smallMultipleWidth = (visUtils.getSvgWidth() - (self.numSmallMultiplesPerRow * self.smallMultiplePadding)) / self.numSmallMultiplesPerRow;
            self.smallMultipleHeight = 300;

            scope.broadcastChange();

            function cellsChanged(slot, cells, childType, useTargetLabelGroups, useOnlySelectedTargets, selectedTargets, convertToNm, useRadius) {

                scope.model.ui.details.cellId = -1;
                var cellIndexes = cells.indexes;
                var svgWidth = visUtils.getSvgWidth();
                var numRows = cellIndexes.length / self.numSmallMultiplesPerRow;
                var svgHeight = 1000;
                console.log(svgHeight);
                if (!self.mainGroup) {
                    self.mainGroup = d3.select(element[0])
                        .append('svg')
                        .attr('width', svgWidth)
                        .attr('height', svgHeight);
                }
                visUtils.clearGroup(self.mainGroup);

                var offsets = new utils.Point2D(self.smallMultipleWidth, self.smallMultipleHeight);
                for (var i = 0; i < cellIndexes.length; ++i) {
                    var positionInGrid = visUtils.computeGridPosition(i, self.numSmallMultiplesPerRow);
                    var position = positionInGrid.multiply(offsets);
                    var totalPadding = positionInGrid.multiply(new utils.Point2D(self.smallMultiplePadding, self.smallMultiplePadding));
                    position = position.add(totalPadding);

                    var group = self.mainGroup.append('g')
                        .attr('transform', 'translate' + position.toString());

                    visUtils.addOutlineToGroup(group, self.smallMultipleWidth, self.smallMultipleHeight);
                    //var chart = new visBarChart.BarChartD3();

                    //chart.activate(group, cells.ids[i], self.smallMultipleWidth, self.smallMultipleHeight, targets, chartData[i], maxCount, onBarClicked);

                }

            }
        }
    }


})();
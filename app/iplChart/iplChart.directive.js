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
            scope.broadcastChange();

            function cellsChanged(slot, cells, childType, useTargetLabelGroups, useOnlySelectedTargets, selectedTargets, convertToNm, useRadius) {

                scope.model.ui.details.cellId = -1;

                $log.debug('iplChart - cells changed');


            }
        }
    }


})();
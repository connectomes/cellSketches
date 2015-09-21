(function () {
    'use strict';

    angular.module('app.helloWorld')
        .directive('childrenBarChart', childrenBarChart);

    childrenBarChart.$inject = ['volumeCells', 'volumeStructures'];

    function childrenBarChart(volumeCells, volumeStructures) {

        return {
            link: link,
            restrict: 'EA'
        };

        function link(scope, element, attrs) {
            var svgWidth = 600;
            var svgHeight = 400;
            console.log("hello bar chart!");
            console.log(volumeCells.getNumCells());

            var svg = d3.select(element[0]).
                append('svg').attr({
                    width: svgWidth,
                    height: svgHeight
                });

            var mainPadding = 20;
            var mainWidth = svgWidth - mainPadding;
            var mainHeight = svgHeight - mainPadding;
            var mainGroup = svg.append('g').
                attr({
                    'transform': 'translate(' + mainPadding / 2 + ',' + mainPadding / 2+ ')'
                });

            addOutlineToGroup(mainGroup, mainWidth, mainHeight);

            var numSmallMultiplesPerRow = 5;
            var smallMultiplePadding = 10;
            var smallMultipleWidth = (svgWidth - (numSmallMultiplesPerRow * smallMultiplePadding)) / numSmallMultiplesPerRow;
            var smallMultipleHeight = smallMultipleWidth;
            var smallMultipleOffsets = new Point2D(smallMultiplePadding + smallMultipleWidth, smallMultiplePadding + smallMultipleHeight);

            scope.$on('cellsChanged', cellsChanged);

            function cellsChanged(slot, cells) {




                // TODO: Make this loop over all cells
                for (var i = 1; i < cells.length; ++i) {
                    var currName = cells[i].name;
                    var currIndex = cells[i].indexes[0];

                    //var numChildStructureTypes = volumeStructures.getNumChildStructureTypes();
                    //for(var j=0; j<numChildStructureTypes; ++j) {
                    // 1. Find max number of cell neighbors for a given child type.
                    // 2. Compute graph ht given
                    var childType = 28; // gap juction
                    var cellPartners = volumeCells.getCellNeighborLabelsByChildType(currIndex, childType);
                    console.log('Child type: ' + childType);
                    console.log(cellPartners);
                    var barChart = mainGroup
                        .chart("BarChart")
                        .width(200)
                        .height(150)
                        .xAxisLabel('hello');

                    // convert cell partners into child iput for bar chart
                    var chartInput = [];
                    for(var j=0; j<cellPartners.length; ++j) {
                        chartInput.push({name: cellPartners[j].label,
                            value: cellPartners[j].indexes.length,
                            details: cellPartners[j].indexes});
                    }

                    barChart.draw(
                       chartInput
                    );

                    barChart.layer('bars').selectAll('*').on('click', function(d) {
                            console.log(d);
                        }
                    );

                }
            }

            // TODO Put this somewhere else
            function computeGridPosition(i, numSmallMultiplesPerRow) {
                if (i < numSmallMultiplesPerRow) {
                    return new Point2D(i, 0);
                } else {
                    var row = Math.floor(i / numSmallMultiplesPerRow);
                    var col = i % numSmallMultiplesPerRow;
                    return new Point2D(col, row);
                }
            }
        }

    }

})();
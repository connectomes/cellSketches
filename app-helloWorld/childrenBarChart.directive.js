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
                var svgWidth = 1350;
                var svgHeight = 1012;
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
                        'transform': 'translate(' + mainPadding / 2 + ',' + mainPadding / 2 + ')'
                    });

                addOutlineToGroup(mainGroup, mainWidth, mainHeight);

                var numSmallMultiplesPerRow = 6;
                var smallMultiplePadding = 10;
                var smallMultipleWidth = (svgWidth - (numSmallMultiplesPerRow * smallMultiplePadding)) / numSmallMultiplesPerRow;
                var smallMultipleHeight = 300;
                var smallMultipleOffsets = new Point2D(smallMultiplePadding + smallMultipleWidth, smallMultiplePadding + smallMultipleHeight);

                scope.$on('cellsChanged', cellsChanged);

                function cellsChanged(slot, cells) {

                    // Get a unique list of all cell partner class types.
                    var childType = 28; // Gap Junction
                    var yAxisLabels = [];
                    for (var i = 0; i < cells.length; ++i) {
                        for (var j = 0; j < cells[i].indexes.length; ++j) {
                            var currIndex = cells[i].indexes[j];
                            var currPartners = volumeCells.getCellNeighborLabelsByChildType(currIndex, childType);
                            for (var k = 0; k < currPartners.length; ++k) {
                                var currLabel = currPartners[k].label;
                                if (yAxisLabels.indexOf(currLabel) == -1) {
                                    yAxisLabels.push(currLabel);
                                }
                            }
                        }
                    }

                    yAxisLabels.sort();
                    console.log(yAxisLabels);

                    function getCellPartnersOfLabel(cellPartners, label) {
                        for (var i = 0; i < cellPartners.length; ++i) {
                            if (cellPartners[i].label == label) {
                                return cellPartners[i].indexes;
                            }
                        }
                        return [];
                    }
                    var numCharts = 0;
                    for (i = 0; i < cells.length; ++i) {
                        for (j = 0; j < cells[i].indexes.length; ++j) {
                            currIndex = cells[i].indexes[j];
                            currPartners = volumeCells.getCellNeighborLabelsByChildType(currIndex, childType);

                            var currCellData = [];
                            for (k = 0; k < yAxisLabels.length; ++k) {
                                currLabel = yAxisLabels[k];
                                currPartners = getCellPartnersOfLabel(currPartners, currLabel);
                                currCellData.push({
                                    name: currLabel,
                                    value: currPartners.length,
                                    details: currPartners
                                });
                            }
                            console.log(currCellData);

                            var barChartGroup = mainGroup.append('g').attr({
                                transform: function () {
                                    var position = computeGridPosition(numCharts, numSmallMultiplesPerRow);
                                    position = position.multiply(smallMultipleOffsets).add(new Point2D(smallMultiplePadding, 0));
                                    return 'translate' + position.toString();
                                }
                            });
                            var currCell = volumeCells.getCellAt(currIndex);
                            var title = 'Cell: ' + currCell.id + ' label: ' + currCell.label;
                            var chart = new BarChart(barChartGroup, currCellData, title, smallMultipleHeight, smallMultipleWidth);
                            numCharts++;
                        }
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

    })
();
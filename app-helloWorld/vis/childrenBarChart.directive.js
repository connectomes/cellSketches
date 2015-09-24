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
            var svgHeight = 800;

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
            var smallMultipleHeight = 250;
            var smallMultipleOffsets = new Point2D(smallMultiplePadding + smallMultipleWidth, smallMultiplePadding + smallMultipleHeight);

            scope.$on('cellsChanged', cellsChanged);

            function cellsChanged(slot, cells, childType, useSecondaryCells, secondaryCells) {

                mainGroup.selectAll('*').remove();
                addOutlineToGroup(mainGroup, mainWidth, mainHeight);

                // Get a unique list of all cell partner class types.
                // This will be labels for the yAxis.
                var yAxisLabels = getYAxisLabels(cells, childType, useSecondaryCells, secondaryCells);

                yAxisLabels.sort();

                // Create a bar chart for each cell.
                var data = getChartDataListAndTitles(cells, childType, yAxisLabels, useSecondaryCells, secondaryCells);
                var chartDataList = data.chartDataList;
                var chartTitles = data.chartTitles;
                var xAxisMaximum = data.xAxisMaximum;
                var cellIds = data.cellIds;

                var output = "cellid, hull area, num children";

                for(var i=0; i<yAxisLabels.length; ++i) {
                    output = output + ", " + yAxisLabels[i];
                }

                output = output + '\n';
                var outputBinary = false;
                //outputBinary = true;
                for(i=0; i<cellIds.length; ++i) {
                    output = output + cellIds[i] + ', ';
                    output = output + volumeCells.getCellConvexHullAreaAt(volumeCells.getCellIndex(cellIds[i])) + ', ';
                    output = output + volumeCells.getNumCellChildrenAt(volumeCells.getCellIndex(cellIds[i]));

                    for (var j = 0; j < yAxisLabels.length; ++j) {
                        if(outputBinary) {
                            output = output + ", " + ((chartDataList[i][j].value > 0) ? '1' : '0');
                        } else {
                            output = output + ", " + chartDataList[i][j].value;
                        }
                    }

                    output = output + '\n';
                }

                console.log(output);

                for (i = 0; i < chartDataList.length; ++i) {

                    var barChartGroup = mainGroup.append('g').attr({
                        transform: function () {
                            var position = computeGridPosition(i, numSmallMultiplesPerRow);
                            position = position.multiply(smallMultipleOffsets).add(new Point2D(smallMultiplePadding, 10));
                            return 'translate' + position.toString();
                        }
                    });

                    var chart = new BarChart(barChartGroup, chartDataList[i], chartTitles[i], smallMultipleHeight, smallMultipleWidth, xAxisMaximum, markClickCallback);
                }


            }

            function getYAxisLabels(cells, childType, useSecondaryCells, secondaryCells) {
                var yAxisLabels = [];
                if (!useSecondaryCells) {
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

                } else {
                    for (i = 0; i < secondaryCells.length; ++i) {
                        yAxisLabels.push(secondaryCells[i].name);
                    }
                }
                return yAxisLabels;
            }

            function getChartDataListAndTitles(cells, childType, yAxisLabels, useSecondaryCells, secondaryCells) {
                var xAxisMaximum = 0;
                var chartDataList = [];
                var chartTitles = [];
                var cellIds = [];
                for (var i = 0; i < cells.length; ++i) {
                    for (var j = 0; j < cells[i].indexes.length; ++j) {

                        var currIndex = cells[i].indexes[j];
                        var currCellData = [];

                        for (var k = 0; k < yAxisLabels.length; ++k) {
                            var currLabel = yAxisLabels[k];

                            if (!useSecondaryCells) {
                                var cellsInLabel = volumeCells.getCellIndexesInLabel(currLabel);
                                console.log(cellsInLabel);
                                var currCellChildren = volumeCells.getCellChildrenConnectedToIndexes(currIndex, cellsInLabel, childType);
                            } else {
                                var currSecondaryCellIndex = -1;
                                for (var n = 0; n < secondaryCells.length; ++n) {
                                    if (secondaryCells[n].name == currLabel) {
                                        currSecondaryCellIndex = n;
                                        break;
                                    }
                                }

                                currCellChildren = volumeCells.getCellChildrenConnectedToIndexes(currIndex, secondaryCells[currSecondaryCellIndex].indexes, childType);
                                console.log(secondaryCells[currSecondaryCellIndex].indexes);
                            }


                            var details = [];

                            for (n = 0; n < currCellChildren.length; n++) {
                                details.push(volumeCells.getCellChildAt(currIndex, currCellChildren[n]).id);
                            }

                            currCellData.push({
                                name: currLabel,
                                value: currCellChildren.length,
                                details: details
                            });

                            xAxisMaximum = Math.max(xAxisMaximum, currCellChildren.length);

                        }

                        chartDataList.push(currCellData);
                        var currCell = volumeCells.getCellAt(currIndex);
                        cellIds.push(currCell.id);
                        chartTitles.push('Cell: ' + currCell.id + ' label: ' + currCell.label);
                    }
                }

                return {
                    chartDataList: chartDataList,
                    chartTitles: chartTitles,
                    xAxisMaximum: xAxisMaximum,
                    cellIds: cellIds
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

            function markClickCallback(d) {

                var cells = [];

                //for (var i = 0; i < d.details.length; ++i) {
                //cells.push(volumeCells.getCellAt(d.details[i]).id);
                //}

                scope.$apply(function () {
                    scope.details = d.details;
                });
            }

            function getCellPartnersOfLabel(cellPartners, label) {
                for (var i = 0; i < cellPartners.length; ++i) {
                    if (cellPartners[i].label == label) {
                        return cellPartners[i].neighborIndexes;
                    }
                }
                return [];
            }

        }

    }

})
();
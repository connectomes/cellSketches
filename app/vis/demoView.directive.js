/**
 * Copyright (c) Ethan Kerzner 2015
 */

myApp.directive('demoView', demoView);

function demoView(volumeCells) {

    return {
        link: link,
        restrict: 'EA'
    };

    function link(scope, element, attrs) {

        // Local variables.
        var svg;
        var svgWidth = 1650;
        var svgHeight = 915;
        var controlWidth = 200;
        var mainWidth = svgWidth - controlWidth - 30;
        var mainHeight = svgHeight - 10;
        var mainX = 10;
        var mainY = 2;
        var mainGroup;

        var numSmallMultiplesPerRow = 6;
        var smallMultiplePadding = 10;
        var smallMultipleWidth = (mainWidth - (numSmallMultiplesPerRow * smallMultiplePadding)) / numSmallMultiplesPerRow;
        var smallMultipleOffsets = new Point2D(smallMultiplePadding + smallMultipleWidth, smallMultiplePadding + smallMultipleWidth);
        var settings = {
            displayBarCharts: true,
            displayStructures: false
        };

        activate();

        // function definitions
        function activate() {
            svg = d3.select(element[0]).
                append('svg').attr({
                    width: svgWidth,
                    height: svgHeight
                });

            svg = svg.append('g');
            svg.attr('transform', 'translate(10,10)');
            svg.append('rect').attr({
                width: svgWidth,
                height: svgHeight,
                fill: 'none'
            });

            mainGroup = svg.append('g').
                attr({
                    'transform': 'translate(' + mainX + ',' + mainY + ')'
                });

            createControls();

            scope.$on('loadedCellsChanged', drawGraphs);
        }

        function createControls() {

            var controlGroup = svg.append('g')
                .attr({
                    'transform': 'translate(' + (svgWidth - controlWidth - 15) + ',' + mainY + ')'
                });

            controlGroup.append('rect')
                .attr({
                    width: controlWidth,
                    height: svgHeight - 15,
                    fill: 'none'
                }).style({
                    outline: 'thin solid darkgrey'
                });

            var yPosition = 10;
            var yPadding = 10;
            var buttonHeight = 20;


            function barChartsClicked() {
                settings.displayBarCharts = true;
                settings.displayStructures = false;
            }

            function structuresClicked() {
                settings.displayBarCharts = false;
                settings.displayStructures = true;
            }

            controlGroup.append('foreignObject')
                .attr({
                    width: controlWidth,
                    height: buttonHeight,
                    x: 10,
                    y: yPosition
                }).on('click', barChartsClicked)
                .html("<input type=\"button\" value=\"Draw Bar Charts\">");

            yPosition = yPosition + buttonHeight + yPadding;
            controlGroup.append('foreignObject')
                .attr({
                    width: controlWidth,
                    height: 100,
                    x: 10,
                    y: yPosition
                }).on('click', structuresClicked)
                .html("<input type=\"button\" value=\"Draw Structures\">");
        }

        function drawGraphs() {
            mainGroupClear();
            if (settings.displayBarCharts) {
                drawBarCharts();
            } else {
                drawStructures();
            }
        }

        function drawBarCharts() {

            // Create depth counts.
            var cells = volumeCells.getLoadedCellIds();
            var depthCounts = d3.map();
            var maxNumStructures = 0;

            for (var i = 0; i < cells.length; ++i) {

                var count = d3.map();
                var cellId = cells[i];
                var locations = volumeCells.getCellLocations(cellId);

                for (var j = 0; j < locations.length; ++j) {

                    var z = locations[j].z;
                    var locationId = locations[j].id;

                    if(count.has(z)) {
                        var value = count.get(z);
                        value.push(locationId);
                        maxNumStructures = value.length > maxNumStructures ? value.length : maxNumStructures;
                        count.set(z, value);
                    } else {
                        var array = [];
                        array[0] = locationId;
                        count.set(z, array);
                    }
                }

                depthCounts.set(cellId, count);
            }

            console.log(depthCounts);
            console.log(maxNumStructures);

            var yScale = d3.scale.ordinal();
            var xScale = d3.scale.linear();

            var xAxis = d3.svg.axis();
            var yAxis = d3.svg.axis();

            var xAxisNoTicks = d3.svg.axis();
            var yAxisNoTicks = d3.svg.axis();

            function computeGridPosition(i) {
                if(i<numSmallMultiplesPerRow) {
                    return new Point2D(i, 0);
                } else {
                    var row = Math.floor(i/numSmallMultiplesPerRow);
                    var col = i % numSmallMultiplesPerRow;
                    return new Point2D(col, row);
                }
            }

            var groups = mainGroup.selectAll('g')
                .data(depthCounts.values())
                .enter()
                .append('g')
                .attr({
                    transform: function(d,i) {
                        var position = computeGridPosition(i);
                        position = position.multiply(smallMultipleOffsets);
                        return 'translate' + position.toString();
                    }
                });

            groups.append('rect').attr({width:10, height:10, fill:'black'});
        }

        function drawStructures() {
            console.log('drawStructures');
        }

        function mainGroupClear() {
            mainGroup.selectAll('*').remove();
        }
    }
}
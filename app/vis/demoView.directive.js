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
        var smallMultiplePadding = 20;
        var smallMultipleWidth = (mainWidth - (numSmallMultiplesPerRow * smallMultiplePadding)) / numSmallMultiplesPerRow;
        var smallMultipleHeight = smallMultipleWid  th;
        var smallMultipleOffsets = new Point2D(smallMultiplePadding + smallMultipleWidth, smallMultiplePadding + smallMultipleHeight);

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
            var maxDepth = 0;

            for (var i = 0; i < cells.length; ++i) {

                var count = d3.map();
                var cellId = cells[i];
                var locations = volumeCells.getCellLocations(cellId);

                for (var j = 0; j < locations.length; ++j) {

                    var z = locations[j].z;
                    var locationId = locations[j].id;
                    maxDepth = (z > maxDepth) ? z : maxDepth;

                    if (count.has(z)) {
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

            var yScale = d3.scale.ordinal();
            var xScale = d3.scale.linear();

            var xAxis = d3.svg.axis();
            var yAxis = d3.svg.axis();

            var xAxisNoTicks = d3.svg.axis();
            var yAxisNoTicks = d3.svg.axis();
            var domain = [];

            for (i = 0; i < maxDepth; ++i) {
                domain.push(i);
            }

            yScale.domain(domain)
                .rangeBands([0, smallMultipleHeight]);

            yAxis.scale(yScale)
                .orient('left')
                .tickValues(yScale.domain().filter(function (d, i) {
                    return !(i % 50);
                }));

            yAxisNoTicks.scale(yScale)
                .orient('left')
                .tickValues(yScale.domain().filter(function (d, i) {
                    return !(i % 50);
                })).tickFormat(function (d) {
                    return '';
                });

            xScale.domain([0, maxNumStructures])
                .range([0, smallMultipleWidth]);

            xAxis.scale(xScale)
                .orient('bottom');

            xAxisNoTicks.scale(xScale)
                .orient('bottom')
                .tickFormat(function (d) {
                    return '';
                });

            function computeGridPosition(i) {
                if (i < numSmallMultiplesPerRow) {
                    return new Point2D(i, 0);
                } else {
                    var row = Math.floor(i / numSmallMultiplesPerRow);
                    var col = i % numSmallMultiplesPerRow;
                    return new Point2D(col, row);
                }
            }

            var groups = mainGroup.selectAll('g')
                .data(depthCounts.values())
                .enter()
                .append('g')
                .attr({
                    transform: function (d, i) {
                        var position = computeGridPosition(i);
                        position = position.multiply(smallMultipleOffsets);
                        return 'translate' + position.toString();
                    }
                });

            groups.append('g')
                .attr('class', 'x axis')
                .attr('transform', 'translate(0,' + smallMultipleHeight + ')')
                .call(xAxisNoTicks);

            groups.append('g')
                .attr('class', 'y axis')
                .call(yAxisNoTicks);

            console.log(cells);


            groups.each(function (d, i) {

                var lengths = d.values().map(function (d) {
                    return d.length;
                });

                var data = d3.zip(d.keys(), lengths);

                d3.select(this)
                    .append('text')
                    .attr({
                        x: smallMultipleWidth / 2,
                        y: 8
                    })
                    .style({
                        'font-size': '12px',
                        'text-anchor': 'middle'
                    }).text(cells[i]);

                // 'this' is the group being iterated on.
                d3.select(this)
                    .selectAll('rect')
                    .data(data)
                    .enter()
                    .append('rect')
                    .attr({
                        class: 'bar',
                        x: 0,
                        y: function (d) {
                            return yScale(d[0]);
                        },
                        height: yScale.rangeBand(),
                        width: function (d) {
                            return xScale(d[1]);
                        }
                    });
            });
        }

        function drawStructures() {
            console.log('drawStructures');
        }

        function mainGroupClear() {
            mainGroup.selectAll('*').remove();
        }
    }
}
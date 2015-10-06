(function () {
    'use strict';

    angular.module('app.smallMultiplesDemo')
        .directive('demoView', demoView);

    function demoView(volumeCells, volumeBounds, volumeLayers) {

        return {
            link: link,
            restrict: 'EA'
        };

        function link(scope, element, attrs) {

            // Local variables.
            var svg;
            var svgWidth = 1650;
            var svgHeight = 1000;
            var controlWidth = 200;
            var mainWidth = svgWidth - controlWidth - 30;
            var mainHeight = svgHeight - 10;
            var mainX = 0;
            var mainY = 2;
            var mainGroup;

            var numSmallMultiplesPerRow = 5;
            var smallMultiplePadding = 45;
            var smallMultipleWidth = (mainWidth - (numSmallMultiplesPerRow * smallMultiplePadding)) / numSmallMultiplesPerRow;
            var smallMultipleHeight = smallMultipleWidth;
            var smallMultipleOffsets = new Point2D(smallMultiplePadding + smallMultipleWidth, smallMultiplePadding + smallMultipleHeight);

            d3.selection.prototype.moveToFront = function () {
                return this.each(function () {
                    this.parentNode.appendChild(this);
                });
            };

            d3.selection.prototype.moveToBack = function () {
                return this.each(function () {
                    var firstChild = this.parentNode.firstChild;
                    if (firstChild) {
                        this.parentNode.insertBefore(this, firstChild);
                    }
                });
            };

            var tooltip;

            var settings = {
                displayBarCharts: false,
                displayStructures: true,
                convexHulls: false,
                largeSingle: true
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
                tooltipCreate();

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
                    drawGraphs();
                }

                function structuresClicked() {
                    settings.displayBarCharts = false;
                    settings.displayStructures = true;
                    drawGraphs();
                }

                function convexHullsClicked() {
                    settings.convexHulls = !settings.convexHulls;
                    drawGraphs();
                }

                function largeSingleClicked() {
                    settings.largeSingle = !settings.largeSingle;
                    drawGraphs();
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

                yPosition += buttonHeight + yPadding;
                controlGroup.append('foreignObject')
                    .attr({
                        width: controlWidth,
                        height: 100,
                        x: 10,
                        y: yPosition
                    }).on('click', convexHullsClicked)
                    .html("<input type=\"button\" value=\"Toggle pts/convex hull\">");

                yPosition += buttonHeight + yPadding;
                controlGroup.append('foreignObject')
                    .attr({
                        width: controlWidth,
                        height: 100,
                        x: 10,
                        y: yPosition
                    }).on('click', largeSingleClicked)
                    .html("<input type=\"button\" value=\"Toggle lg/sm\">");
            }

            function computeGridPosition(i) {
                if (i < numSmallMultiplesPerRow) {
                    return new Point2D(i, 0);
                } else {
                    var row = Math.floor(i / numSmallMultiplesPerRow);
                    var col = i % numSmallMultiplesPerRow;
                    return new Point2D(col, row);
                }
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

                console.log('drawStructures!');

                if (settings.largeSingle) {
                    createLargeSingles();
                } else {
                    createSmallMultiples();
                }

                // Function definitions

                function createLargeSingles() {

                    var data = prepareData();
                    var dataPointsXZ = data.dataPointsXZ;
                    var dataPointsXY = data.dataPointsXY;
                    var zMin = data.zMin;
                    var zMax = data.zMax;

                    // Define group positions in the main group
                    var largeSinglesPadding = mainWidth * 0.025;

                    var largeSinglesXZPosition = new Point2D(largeSinglesPadding, largeSinglesPadding);

                    var largeSinglesXZWidth = mainWidth - (largeSinglesPadding * 2);
                    var largeSinglesXZHeight = largeSinglesXZWidth / 3;

                    var largeSinglesOtherWidth = largeSinglesXZHeight;
                    var largeSinglesOtherHeight = largeSinglesXZHeight;

                    var largeSinglesXYPosition = new Point2D(largeSinglesPadding, largeSinglesXZHeight + (largeSinglesPadding * 2));
                    var largeSinglesChildrenPosition = new Point2D(largeSinglesPadding + largeSinglesOtherWidth, largeSinglesXYPosition.y);

                    // Create groups that will hold the scatterplots
                    var largeSinglesXZGroup = mainGroup.append('g')
                        .attr({transform: 'translate' + largeSinglesXZPosition.toString()});

                    var largeSinglesXYGroup = mainGroup.append('g')
                        .attr({transform: 'translate' + largeSinglesXYPosition.toString()});

                    var largeSinglesChildrenGroup = mainGroup.append('g')
                        .attr({transform: 'translate' + largeSinglesChildrenPosition.toString()});

                    // Create scales for the xz data
                    var yScale = d3.scale.linear();
                    var xScale = d3.scale.linear();
                    var rScale = d3.scale.linear();
                    var cScale = d3.scale.linear();

                    yScale.domain([zMin, zMax])
                        .range([0, largeSinglesXZHeight]);

                    xScale.domain(volumeBounds.getRangeVolumeX())
                        .range([0, largeSinglesXZWidth]);

                    cScale.domain([zMin, zMax])
                        .range(["darkgrey", "darkgrey"]);

                    rScale.domain([0, volumeBounds.getRangeVolumeX()[1]])
                        .range([0, largeSinglesXZHeight]);

                    // TODO: replace this with a real callback
                    function callback() {
                        console.log('I\'m a callback');
                    }

                    createScatterPlotLargeSingle(largeSinglesXZGroup, largeSinglesXZWidth, largeSinglesXZHeight,
                        dataPointsXZ, xScale, yScale, rScale, cScale, tooltipMove, tooltipHide, callback);

                    xScale.domain(volumeBounds.getRangeVolumeX())
                        .range([0, largeSinglesOtherWidth]);

                    yScale.domain(volumeBounds.getRangeVolumeY())
                        .range([largeSinglesOtherHeight, 0]);

                    createScatterPlotLargeSingle(largeSinglesXYGroup, largeSinglesOtherWidth, largeSinglesOtherHeight,
                        dataPointsXY, xScale, yScale, rScale, cScale, tooltipMove, tooltipHide, callback);

                    // TODO: create child scatterplot
                }

                function createScatterPlotLargeSingle(group, width, height, data, xScale, yScale, rScale, cScale, mouseOverCb, mouseOutCb, clickCb) {

                    var xAxis = d3.svg.axis();
                    var yAxis = d3.svg.axis();
                    yAxis.scale(yScale)
                        .orient('left');

                    var yAxisGroup = group.append('g')
                        .attr('class', 'y axis')
                        .call(yAxis);

                    xAxis.scale(xScale)
                        .orient('bottom')
                        .ticks(6);

                    var xAxisGroup = group.append('g')
                        .attr('class', 'x axis')
                        .call(xAxis);

                    /*
                     // TODO: make this a parameter
                     yAxisGroup.append('text')
                     .attr('text-anchor', 'middle')
                     .attr('transform', 'translate(' + (-25) + ',' + (height/2) + ')rotate(-90)')

                     xAxisGroup.append('text')
                     .attr({
                     'text-anchor': 'middle',
                     'transform': 'translate(' + height +  ',' + 25 + ')'
                     })
                     .text('VolumeX Position');
                     */

                    xAxisGroup.attr({
                        'transform': 'translate(0,' + height + ')'
                    });

                    data.forEach(function (key, value) {

                        var cellGroup = group.append('g').attr({
                            id: key
                        });

                        cellGroup.selectAll('circle')
                            .data(value)
                            .enter()
                            .append('circle')
                            .attr({
                                cx: function (d, i) {
                                    return xScale(d.position.x);
                                },
                                cy: function (d) {
                                    return yScale(d.position.y);
                                },
                                r: function (d) {
                                    return rScale(d.radius);
                                },
                                fill: 'none',
                                stroke: function (d) {
                                    return cScale(d.c);
                                }
                            })
                            .on('mouseover', mouseOverCb)
                            .on('mouseout', mouseOutCb);

                    });


                }

                function createSmallMultiples() {

                    var data = prepareData();
                    var cells = volumeCells.getLoadedCellIds();
                    var dataPointsXZ = data.dataPointsXZ;
                    var dataPointsXY = data.dataPointsXY;
                    var zMin = data.zMin;
                    var zMax = 1.0;

                    for (var i = 0; i < cells.length; ++i) {
                        var position = computeGridPosition(i);
                        var group = mainGroup.append('g')
                            .attr({
                                transform: function () {
                                    position = position.multiply(smallMultipleOffsets).add(new Point2D(smallMultiplePadding, 0));
                                    return 'translate' + position.toString();
                                }
                            });

                        var yScale = d3.scale.linear();
                        var xScale = d3.scale.linear();
                        var rScale = d3.scale.linear();
                        var cScale = d3.scale.linear();

                        yScale.domain([zMin, zMax])
                            .range([0, smallMultipleHeight]);

                        xScale.domain(volumeBounds.getRangeVolumeX())
                            .range([0, smallMultipleWidth]);

                        cScale.domain([zMin, zMax])
                            .range(["darkgrey", "darkgrey"]);

                        rScale.domain([0, volumeBounds.getRangeVolumeX()[1]])
                            .range([0, smallMultipleHeight]);

                        var tempMap = d3.map();
                        tempMap.set(cells[i], dataPointsXZ.get(cells[i]));
                        group.append('text')
                            .attr({
                                x: smallMultipleWidth / 2,
                                y: 8
                            })
                            .style({
                                'font-size': '12px',
                                'text-anchor': 'middle'
                            }).text(cells[i]);

                        createScatterPlotLargeSingle(group, smallMultipleWidth, smallMultipleHeight, tempMap, xScale, yScale, rScale, cScale, tooltipMove, tooltipHide);
                    }
                }
            }

            function mainGroupClear() {
                mainGroup.selectAll('*').remove();
            }

            function prepareData() {
                var cells = volumeCells.getLoadedCellIds();

                var dataPointsXZ = d3.map();
                var dataPointsXY = d3.map();

                var zMin = 0;
                var zMax = 0;

                for (var i = 0; i < cells.length; ++i) {

                    var locations = volumeCells.getCellLocations(cells[i]);
                    var currDataPointsXZ = [];
                    var currDataPointsXY = [];

                    for (var j = 0; j < locations.length; ++j) {

                        var location = locations[j];
                        var z = volumeLayers.convertToIPLPercent([location.x, location.y, location.z]).percent;
                        var dataPointXZ = {
                            position: new Point2D(location.volumeX, z),
                            radius: location.radius,
                            c: z,
                            parent: cells[i],
                            id: location.id
                        };

                        var dataPointXY = {
                            position: new Point2D(location.volumeX, location.volumeY),
                            radius: location.radius,
                            c: z,
                            parent: cells[i],
                            id: location.id
                        };

                        zMin = Math.min(zMin, z);
                        zMax = Math.max(zMax, z);

                        currDataPointsXZ.push(dataPointXZ);
                        currDataPointsXY.push(dataPointXY);
                    }

                    dataPointsXZ.set(cells[i], currDataPointsXZ);
                    dataPointsXY.set(cells[i], currDataPointsXY);
                }

                return {
                    dataPointsXZ: dataPointsXZ,
                    dataPointsXY: dataPointsXY,
                    zMin: zMin,
                    zMax: zMax
                }
            }

            function tooltipCreate() {
                tooltip = d3.select('body').append('div');

                tooltip.attr('id', 'tooltip');

                tooltip.html('')
                    .attr('class', 'tooltip')
                    .style('display', 'none');
            }

            function tooltipHide(d, i) {

                d3.select(this)
                    .attr({
                        fill: 'none',
                        stroke: 'darkgrey'
                    }).moveToBack();

                d3.select('#tooltip').style({'display': 'none'});
            }

            function tooltipMove(d, i) {

                d3.select(this)
                    .attr({
                        fill: 'darkblue',
                        stroke: 'darkblue'
                    }).moveToFront();

                var tip = 'ID: ' + d.id + '<br>' +
                    'Cell: ' + d.parent + '<br>';

                tooltip.style('display', 'block');
                tooltip.html(tip);

                // Move the tooltip.
                d3.select("#tooltip")
                    .style('top', d3.event.pageY + 2.5 + 'px')
                    .style('left', d3.event.pageX + 2.5 + 'px')
                    .style('opacity', 1)
                    .html(tip);
            }


        }
    }

})();
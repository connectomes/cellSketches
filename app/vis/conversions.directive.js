/**
 * Copyright (c) Ethan Kerzner 2015
 */

myApp.directive('conversions', conversions);

function conversions(volumeBounds, volumeLayers, volumeCells) {

    var self = this;

    var graphHeight = 400;
    var graphWidth = 500;
    var paddingPerGraph = 30;

    var margin = {top: 20, right: 20, bottom: 30, left: 30},
        width = 1800 - margin.left - margin.right,
        height = 1280 - margin.top - margin.bottom;

    self.iplYScale = {};

    return {
        link: link,
        restrict: 'EA'
    };

    function link(scope, element, attrs) {

        self.svg = d3.select(element[0]).append('svg')
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        self.tooltip = d3.select('body').append('div');

        self.tooltip.attr('id', 'tooltip');

        self.tooltip.html('')
            .attr('class', 'tooltip')
            .style('display', 'none');

        scope.$on('loadedCellsChanged', cellChanged);
        scope.$on('radiusChanged', updateConversionCache);
    }

    function cellChanged(event, cell) {

        // Delete everything!
        self.svg.selectAll('*').remove();

        var top = volumeLayers.getUpperBounds();
        var bottom = volumeLayers.getLowerBounds();

        var cellIds = volumeCells.getLoadedCellIds();

        var locations = [];
        self.cachedConversions = [];
        for (var i = 0; i < cellIds.length; ++i) {
            var currId = cellIds[i];
            var currLocations = volumeCells.getCellLocations(currId);
            for (var j = 0; j < currLocations.length; ++j) {
                currLocations[j].parent = cellIds[i];
                currLocations[j].hasConversion = true;
                self.cachedConversions[locations.length + j] = volumeLayers.convertToIPLPercent([currLocations[j].volumeX, currLocations[j].volumeY, currLocations[j].z]);
            }
            locations = locations.concat(currLocations);
        }

        self.cellXy = self.svg.append('g')
            .attr({
                'id': 'cellXy'
            });

        var yzProjectionX = paddingPerGraph;
        var yzProjectionY = 0;

        var iplPercentX = paddingPerGraph;
        var iplPercentY = graphHeight + paddingPerGraph * 2;

        var boundaryX = yzProjectionX + graphWidth * 2 + paddingPerGraph / 2;

        var topXyX = boundaryX + paddingPerGraph / 2;
        var bottomXyX = topXyX;

        self.cellXzPercent = self.svg.append('g')
            .attr({
                'transform': 'translate(' + iplPercentX + ',' + iplPercentY + ')',
                'id': 'cellPercentXy'
            });

        createIPLGraph(self.cellXzPercent, locations);

        self.bothXz = self.svg.append('g')
            .attr({
                'transform': 'translate(' + yzProjectionX + ' , ' + yzProjectionY + ')',
                'id': 'bothXz'
            });

        createConversionGraph(self.bothXz, top, bottom, locations);

        self.topXy = self.svg.append('g')
            .attr({
                'transform': 'translate(' + topXyX + ' , ' + 0 + ')',
                'id': 'topXy'
            });

        createBoundaryGraphXy(self.topXy, top);

        self.bottomXy = self.svg.append('g')
            .attr({
                'transform': 'translate(' + bottomXyX + ' , ' + (graphHeight - (graphHeight * (2 / 5))) + ')',
                'id': 'bottomXy'
            });

        createBoundaryGraphXy(self.bottomXy, bottom);

    }

    function createIPLGraph(group, locations) {

        self.iplYScale = d3.scale.linear();
        var xScale = d3.scale.linear();

        var xAxis = d3.svg.axis();
        var yAxis = d3.svg.axis();

        var minIplPercent = 1.0;
        var maxIplPercent = 1.0;

        for (var i = 0; i < locations.length; ++i) {
            var percent = self.cachedConversions[i].percent;
            minIplPercent = percent < minIplPercent ? percent : minIplPercent;
        }

        self.iplYScale.domain([minIplPercent, maxIplPercent])
            .range([0, graphHeight]);

        xScale.domain(volumeBounds.getRangeVolumeX())
            .range([0, graphWidth * 2]);

        yAxis.scale(self.iplYScale)
            .orient('left');

        var yAxisGroup = group.append('g')
            .attr('class', 'y axis')
            .call(yAxis);

        yAxisGroup.append("text")
            .attr("text-anchor", "middle")
            .attr("transform", "translate(" + (-paddingPerGraph) + "," + (graphHeight / 2) + ")rotate(-90)")
            .text("Percent of IPL");

        xAxis.scale(xScale)
            .orient('bottom');

        var xAxisGroup = group.append('g')
            .attr('class', 'x axis')
            .call(xAxis);

        xAxisGroup.append('text')
            .attr({
                'text-anchor': 'middle',
                'transform': 'translate(' + graphWidth + ',' + paddingPerGraph + ')'
            })
            .text('VolumeX Position');

        xAxisGroup.attr({
            'transform': 'translate(0,' + graphHeight + ')'
        });

        self.cellGroupPercentIpl = group.append('g');

        self.cellGroupPercentIpl.selectAll("circle")
            .data(locations)
            .enter()
            .append("circle")
            .attr("cx", function (d, i) {
                return xScale(d.volumeX);
            })
            .attr("cy", function (d, i) {
                return self.iplYScale(self.cachedConversions[i].percent);
            })
            .attr("r", function (d) {
                return 1.5;
            })
            .style("stroke", function (d) {
                return "lightgrey";
            })
            .attr("fill", "none")
            .attr("stroke-width", 0.5)
            .on("mouseover", tooltipMove)
            .on("mouseout", tooltipHide);
    }

    function createConversionGraph(group, topLocations, bottomLocations, cellLocations) {

        var yScale = d3.scale.linear();
        var xScale = d3.scale.linear();

        var xAxis = d3.svg.axis();
        var yAxis = d3.svg.axis();

        yScale.domain([0, 380])
            .range([0, graphHeight]);

        xScale.domain(volumeBounds.getRangeVolumeX())
            .range([0, graphWidth * 2]);

        yAxis.scale(yScale)
            .orient('left');

        var yAxisGroup = group.append('g')
            .attr('class', 'y axis')
            .call(yAxis);

        yAxisGroup.append("text")
            .attr("text-anchor", "middle")
            .attr("transform", "translate(" + (-paddingPerGraph) + "," + (graphHeight / 2) + ")rotate(-90)")
            .text("Slice (z value)");

        xAxis.scale(xScale)
            .orient('bottom');

        var xAxisGroup = group.append('g')
            .attr('class', 'x axis')
            .call(xAxis);

        xAxisGroup.append('text')
            .attr({
                'text-anchor': 'middle',
                'transform': 'translate(' + graphWidth + ',' + paddingPerGraph + ')'
            })
            .text('VolumeX Position');

        xAxisGroup.attr({
            'transform': 'translate(0,' + graphHeight + ')'
        });

        self.topGroup = group.append("g");

        self.topGroup.selectAll("circle")
            .data(topLocations)
            .enter()
            .append("circle")
            .attr({
                cx: function (d, i) {
                    return xScale(d.volumeX);
                },
                cy: function (d) {
                    return yScale(d.z);
                },
                r: 2.0,
                fill: "none",
                stroke: "lightblue"
            })
            .on('mouseover', mouseover)
            .on('mouseout', mouseout);


        self.bottomGroup = group.append("g");
        self.bottomGroup.selectAll("circle")
            .data(bottomLocations)
            .enter()
            .append("circle")
            .attr({
                cx: function (d, i) {
                    return xScale(d.volumeX);
                },
                cy: function (d) {
                    return yScale(d.z);
                },
                r: 2.0,
                fill: "none",
                stroke: "lightblue"
            })
            .on('mouseover', mouseover)
            .on('mouseout', mouseout);


        self.cellGroup = group.append("g");
        self.cellGroup.selectAll("circle")
            .data(cellLocations)
            .enter()
            .append("circle")
            .attr("cx", function (d, i) {
                return xScale(d.volumeX);
            })
            .attr("cy", function (d) {
                return yScale(d.z);
            })
            .attr("r", function (d) {
                return 2.0;
            })
            .style("stroke", function (d) {
                return "lightgrey";
            })
            .attr("fill", "none")
            .attr("stroke-width", 0.5)
            .on("mouseover", tooltipMove)
            .on("mouseout", tooltipHide);


        self.lineGroup = group.append('g').attr('id', 'lineGroup');

        var lineAttr = {
            stroke: 'lightgrey',
            'stroke-width': 1.5
        };

        self.cellGroup.selectAll("circle")
            .each(function (d, i) {

                var idxs = [];
                idxs[0] = self.cachedConversions[i].bottomIdxs;
                idxs[1] = self.cachedConversions[i].topIdxs;

                var groups = [];
                groups[0] = self.bottomGroup;
                groups[1] = self.topGroup;

                var mark = selectMark(self.cellGroup, i);
                for (var j = 0; j < idxs.length; ++j) {
                    var currGroup = groups[j];
                    var currIdxs = idxs[j];
                    for (var k = 0; k < currIdxs.length; ++k) {
                        var currIdx = currIdxs[k];
                        var currMark = selectMark(currGroup, currIdx);
                        self.lineGroup.append("line")
                            .attr(lineAttr)
                            .attr({
                                x1: currMark.attr('cx'),
                                y1: currMark.attr('cy'),
                                x2: mark.attr('cx'),
                                y2: mark.attr('cy')
                            })
                            .datum(d.id)
                            .style('display', 'none');
                    }
                }
            }
        );
    }

    function createBoundaryGraphXy(group, locations) {

        var width = graphHeight * (2 / 5);
        var height = graphHeight * (2 / 5);

        var yScale = d3.scale.linear();
        var xScale = d3.scale.linear();

        var xAxis = d3.svg.axis();
        var yAxis = d3.svg.axis();

        yScale.domain(volumeBounds.getRangeVolumeY())
            .range([0, height]);
        xScale.domain(volumeBounds.getRangeVolumeX())
            .range([0, width]);

        yAxis.scale(yScale)
            .orient('left')
            .ticks(0);

        var yAxisGroup = group.append('g')
            .attr('class', 'y axis')
            .call(yAxis);

        yAxisGroup.append("text")
            .attr("text-anchor", "middle")
            .attr("transform", "translate(" + (-10) + "," + (height / 2) + ")rotate(-90)")
            .text("VolumeY Position");

        xAxis.scale(xScale)
            .orient('bottom')
            .ticks(0);

        var xAxisGroup = group.append('g')
            .attr('class', 'x axis')
            .call(xAxis);

        xAxisGroup.append('text')
            .attr({
                'text-anchor': 'middle',
                'transform': 'translate(' + width / 2 + ',10)'
            })
            .text('VolumeX Position');

        xAxisGroup.attr({
            'transform': 'translate(0,' + height + ')'
        });

        group.selectAll("circle")
            .data(locations)
            .enter()
            .append("circle")
            .attr({
                cx: function (d, i) {
                    return xScale(d.volumeX);
                },
                cy: function (d) {
                    return yScale(d.volumeY);
                },
                r: 2.0,
                fill: "none",
                stroke: "lightblue"
            })
            .on('mouseover', mouseover)
            .on('mouseout', mouseout);
    }

    function updateConversionCache() {

        // State of volumeLayers has been changed. Update the cached conversions.
        if (!self.cellGroup) {
            return;
        }

        self.cellGroup.selectAll("circle").each(function (d, i) {
            self.cachedConversions[i] = volumeLayers.convertToIPLPercent([d.volumeX, d.volumeY, d.z]);
        });

        self.cellGroupPercentIpl.selectAll('circle').attr("cy", function (d, i) {
            return self.iplYScale(self.cachedConversions[i].percent);
        });
    }

    function mouseover(d, i) {
        d3.select(this).attr("fill", "blue");
        tooltipMove(d, i);
    }

    function mouseout(d, i) {
        d3.select(this).attr("fill", "none");
        tooltipHide(d, i);
    }

    function tooltipHide(d, i) {

        if (d.hasConversion) {

            setFillOfMarkIndex(self.cellGroup, i, 'none');
            setFillOfMarkIndex(self.cellGroupPercentIpl, i, 'none');

            var idxs = [self.cachedConversions[i].bottomIdxs, self.cachedConversions[i].topIdxs];
            var localGroups = [self.bottomGroup, self.topGroup];
            var referenceGroups = [self.bottomXy, self.topXy];

            for (var j = 0; j < idxs.length; ++j) {
                var currIdxs = idxs[j];
                var currLocalGroup = localGroups[j];
                var currReferenceGroup = referenceGroups[j];

                for (var k = 0; k < currIdxs.length; k++) {
                    var currIdx = currIdxs[k];
                    var currMark = setFillOfMarkIndex(currLocalGroup, currIdx, 'none');
                    setFillOfMarkIndex(currReferenceGroup, currIdx, 'none');
                }
            }

            self.lineGroup.selectAll('line').remove();
        }
    }

    function tooltipMove(d, i) {
        var tip = 'ID: ' + d.id + '<br>' +
            'z: ' + d.z + '<br>';

        self.tooltip.style('display', 'block');

        if (d.hasConversion) {

            tip = tip + '%ipl: ' + d3.format("8,.2f")(self.cachedConversions[i].percent);

            var mark = setFillOfMarkIndex(self.cellGroup, i, 'black');
            setFillOfMarkIndex(self.cellGroupPercentIpl, i, 'black');

            // Prepare to add lines to the graph for current mark.
            var lineAttr = {
                stroke: 'lightgrey',
                'stroke-width': 1.5
            };

            var idxs = [self.cachedConversions[i].bottomIdxs, self.cachedConversions[i].topIdxs];
            var localGroups = [self.bottomGroup, self.topGroup];
            var referenceGroups = [self.bottomXy, self.topXy];

            for (var j = 0; j < idxs.length; ++j) {
                var currIdxs = idxs[j];
                var currLocalGroup = localGroups[j];
                var currReferenceGroup = referenceGroups[j];

                for (var k = 0; k < currIdxs.length; k++) {
                    var currIdx = currIdxs[k];
                    var currMark = setFillOfMarkIndex(currLocalGroup, currIdx, 'blue');
                    setFillOfMarkIndex(currReferenceGroup, currIdx, 'blue');

                    self.lineGroup.append("line")
                        .attr(lineAttr)
                        .attr({
                            x1: currMark.attr('cx'),
                            y1: currMark.attr('cy'),
                            x2: mark.attr('cx'),
                            y2: mark.attr('cy')
                        })
                        .datum(d.id)
                        .style('display', 'block');
                }
            }
        }

        // Move the tooltip.
        d3.select("#tooltip")
            .style('top', d3.event.pageY + 2.5 + 'px')
            .style('left', d3.event.pageX + 2.5 + 'px')
            .style('opacity', 1)
            .html(tip);
    }

    function setFillOfMarkIndex(group, index, fill) {

        var mark = selectMark(group, index);

        mark.attr('fill', fill);

        return mark;
    }

    function selectMark(group, index) {
        var mark = group.selectAll("circle")
            .filter(function (d, i) {
                return i == index;
            });
        return mark;
    }
}
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

        self.tooltip = d3.select(element[0]).append('div');

        self.tooltip.attr('id', 'tooltip');

        self.tooltip.html('')
            .attr('class', 'tooltip');

        scope.$watch('cell', cellChanged);
    }

    function cellChanged(cell) {

        if (!cell) {
            return;
        }

        // Delete everything!
        self.svg.selectAll('*').remove();

        var top = volumeLayers.getUpperBounds();
        var bottom = volumeLayers.getLowerBounds();

        // TODO: Load cells somewhere else. View should just be getting the cached cell info.
        volumeCells.loadCellId(cell.name).then(function () {

            self.cellXy = self.svg.append('g')
                .attr({
                    'id': 'cellXy'
                });

            //createCellStructureGraph(self.cellXy, volumeCells.getCellLocations(cell.name));

            var yzProjectionX = paddingPerGraph;
            var yzProjectionY = 0;

            var iplPercentX = paddingPerGraph;
            var iplPercentY = graphHeight + paddingPerGraph * 2;

            self.cellXzPercent = self.svg.append('g')
                .attr({
                    'transform': 'translate(' + iplPercentX + ',' + iplPercentY + ')',
                    'id': 'cellPercentXy'
                });

            createCellIPLStructureGraph(self.cellXzPercent, volumeCells.getCellLocations(cell.name));

            self.bothXz = self.svg.append('g')
                .attr({
                    'transform': 'translate(' + yzProjectionX + ' , ' + yzProjectionY + ')',
                    'id': 'bothXz'
                });

            createYzProjections(self.bothXz, top, bottom, volumeCells.getCellLocations(cell.name));

        });
    }

    function createCellIPLStructureGraph(group, locations) {

        var yScale = d3.scale.linear();
        var xScale = d3.scale.linear();

        var xAxis = d3.svg.axis();
        var yAxis = d3.svg.axis();

        var minIplPercent = 1.0;
        var maxIplPercent = 1.0;

        for (var i = 0; i < locations.length; ++i) {
            var percent = locations[i].conversion.percent;
            minIplPercent = percent < minIplPercent ? percent : minIplPercent;
        }

        yScale.domain([minIplPercent, maxIplPercent])
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
            .attr("cy", function (d) {
                return yScale(d.conversion.percent);
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

    function createYzProjections(group, topLocations, bottomLocations, cellLocations) {

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
                r: 3.5,
                fill: "none",
                stroke: "lightgrey"
            })
            .on('mouseover', mouseover)
            .on('mouseout', mouseout);

        var lineAttr = {
            stroke: 'lightgrey',
            'stroke-width': 1.5
        };

        self.topLine = group.append("line")
            .attr(lineAttr);

        self.bottomLine = group.append("line")
            .attr(lineAttr);

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
                r: 3.5,
                fill: "none",
                stroke: "lightgrey"
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

    function mouseover(d, i) {
        d3.select(this).attr("fill", "blue");
        tooltipMove(d, i);
    }

    function mouseout(d, i) {
        d3.select(this).attr("fill", "none");
        tooltipHide(d, i);
    }

    function tooltipHide(d, i) {
        var currIdx = i;

        if (d.conversion) {
            var bottomIdx = d.conversion.bottomIdx;
            var topIdx = d.conversion.topIdx;

            setFillOfMarkIndex(self.bottomGroup, bottomIdx, 'none');
            setFillOfMarkIndex(self.topGroup, topIdx, 'none');
            setFillOfMarkIndex(self.cellGroup, currIdx, 'none');
            setFillOfMarkIndex(self.cellGroupPercentIpl, currIdx, 'none');

            self.bottomLine.attr({
                x1: 0,
                y1: 0,
                x2: 0,
                y2: 0
            });

            self.topLine.attr({
                x1: 0,
                y1: 0,
                x2: 0,
                y2: 0
            });
        }
    }

    function tooltipMove(d, i) {
        var tip = 'ID: ' + d.id + '<br>' +
            'z: ' + d.z + '<br>';

        if (d.conversion) {

            tip = tip + '%ipl: ' + d3.format("8,.2f")(d.conversion.percent);

            var bottomIdx = d.conversion.bottomIdx;
            var topIdx = d.conversion.topIdx;
            var currIdx = i;

            var bottomMark = setFillOfMarkIndex(self.bottomGroup, bottomIdx, 'blue');
            var topMark = setFillOfMarkIndex(self.topGroup, topIdx, 'blue');
            var currMark = setFillOfMarkIndex(self.cellGroup, currIdx, 'blue');
            setFillOfMarkIndex(self.cellGroupPercentIpl, currIdx, 'blue');

            self.bottomLine.attr({
                x1: bottomMark.attr('cx'),
                y1: bottomMark.attr('cy'),
                x2: currMark.attr('cx'),
                y2: currMark.attr('cy')
            });

            self.topLine.attr({
                x1: topMark.attr('cx'),
                y1: topMark.attr('cy'),
                x2: currMark.attr('cx'),
                y2: currMark.attr('cy')
            });
        }

        d3.select("#tooltip")
            .style('top', d3.event.pageY + 2.5 + 'px')
            .style('left', d3.event.pageX + 2.5 + 'px')
            .style('opacity', 1)
            .html(tip);
    }

    function setFillOfMarkIndex(group, index, fill) {

        // Select mark.
        var mark = group.selectAll("circle")
            .filter(function (d, i) {
                return i == index;
            });

        mark.attr('fill', fill);

        return mark;
    }
}
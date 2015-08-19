/**
 * Copyright (c) Ethan Kerzner 2015
 */

/*
 * @desc order directive that is specific to the order module at a company named Acme
 * @example <div acme-order-calendar-range></div>
 */

myApp.directive('conversions', conversions);

function conversions(volumeBounds, volumeLayers) {

    var self = this;

    var graphHeight = 340;
    var graphWidth = 340;
    var paddingPerGraph = 30;

    var margin = {top: 20, right: 20, bottom: 30, left: 150},
        width = 1280 - margin.left - margin.right,
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

        scope.$watch('cell', cellChanged);
    }

    function cellChanged() {


        var top = volumeLayers.getTopBounds();
        var bottom = volumeLayers.getBottomBounds();

        self.topXy = self.svg.append('g');
        self.topXy = self.svg.append('g').attr({
            'transform': 'translate(0, '  + ((graphHeight + paddingPerGraph * 2) * 2) + ')'
        });

        createXyProjection(self.topXy, top);

        self.bottomXy = self.svg.append('g').attr({
            'transform': 'translate(' + (graphWidth + paddingPerGraph * 2) + ',' + ((graphHeight + paddingPerGraph * 2) * 2) + ')'
        });

        createXyProjection(self.bottomXy, bottom);

        self.bothXz = self.svg.append('g').attr({
            'transform': 'translate(' + (graphWidth + paddingPerGraph * 2)+ ',' + (graphHeight + paddingPerGraph) + ')'
        });

        createYzProjections(self.bothXz, top, bottom);
    }

    function createXyProjection(group, locations) {

        var yScale = d3.scale.linear();
        var xScale = d3.scale.linear();

        var xAxis = d3.svg.axis();
        var yAxis = d3.svg.axis();

        yScale.domain(volumeBounds.getRangeVolumeY())
            .range([0, graphHeight]);

        xScale.domain(volumeBounds.getRangeVolumeX())
            .range([0, graphWidth]);

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
                r: 1.5
            });
    }

    function createYzProjections(group, topLocations, bottomLocations, cellLocations) {

        var yScale = d3.scale.linear();
        var xScale = d3.scale.linear();

        var xAxis = d3.svg.axis();
        var yAxis = d3.svg.axis();

        yScale.domain([0, 370])
            .range([0, graphHeight]);

        xScale.domain(volumeBounds.getRangeVolumeX())
            .range([0, graphWidth]);

        var topGroup = group.append("g");

        topGroup.selectAll("circle")
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
                r: 1.5
            });

        var bottomGroup = group.append("g");
        bottomGroup.selectAll("circle")
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
                r: 1.5
            });
    }
}
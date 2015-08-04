/**
 * Copyright (c) Ethan Kerzner 2015
 */
myApp.directive('childBarChart', function () {

    function link(scope, el, attr) {

        console.log("Hello d3");

        var margin = {top: 20, right: 20, bottom: 30, left: 150},
            width = 960 - margin.left - margin.right,
            height = 300 - margin.top - margin.bottom;

        var yScale = d3.scale.ordinal();
        var xScale = d3.scale.linear();

        var xAxis = d3.svg.axis();
        var yAxis = d3.svg.axis();

        var svg = d3.select(el[0]).append('svg')
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        scope.$watch('childStructureCount', function (childStructureCount) {

            if (!childStructureCount)
                return;

            var dataset = childStructureCount;

            // Clear svg.
            svg.selectAll("*").remove();

            // Update domain and range.
            yScale.domain(dataset.keys().map(function (d) {
                return d;
            }))
                .rangeRoundBands([margin.bottom, height], 0.05);

            xScale.domain([0, d3.max(dataset.values())])
                .range([0, width]);

            xAxis.scale(xScale)
                .orient("bottom");

            yAxis.scale(yScale)
                .orient("left")
                .ticks(5, "");

            svg.append("g")
                .attr("class", "x axis")
                .attr("transform", "translate(0," + height + ")")
                .call(xAxis);

            svg.append("g")
                .attr("class", "y axis")
                .call(yAxis);

            svg.selectAll("rect")
                .data(d3.zip(dataset.keys(), dataset.values()))
                .enter()
                .append("rect")
                .attr("class", "bar")
                .attr("x", function (d, i) {
                    return 0;
                })
                .attr("y", function (d) {
                    return yScale(d[0]);
                })
                .attr("height", yScale.rangeBand())
                .attr("width", function (d) {
                    return xScale(d[1]);
                });
        });
    }

    return {
        link: link,
        restrict: 'E'
    };
});

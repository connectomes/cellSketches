/**
 * Copyright (c) Ethan Kerzner 2015
 */

myApp.directive('depthPlot', function () {

    function link(scope, el, attr) {

        console.log("Hello locationPlot");

        var margin = {top: 20, right: 20, bottom: 30, left: 150},
            width = 960 - margin.left - margin.right,
            height = 680 - margin.top - margin.bottom;

        var yScale = d3.scale.ordinal();
        var xScale = d3.scale.linear();

        var xAxis = d3.svg.axis();
        var yAxis = d3.svg.axis();

        var svg = d3.select(el[0]).append('svg')
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        scope.$watch('depthCount', function (depthCount) {
            if (!depthCount)
                return;

            var dataset = depthCount;
            var xCenter = width / 2;
            // Clear svg.
            svg.selectAll("*").remove();
            // Update domain and range.
            var domain = [];
            for(var i=0; i<300; ++i){
                domain.push(i);
            }
            yScale.domain(domain).rangeBands([margin.bottom, height]);

            xScale.domain([0, d3.max(dataset.values().map(function (d) {
                return d.length;
            }))]).range([0, width]);

            xAxis.scale(xScale)
                .orient("bottom")
                .ticks(function(d) { return ""; });

            yAxis.scale(yScale)
                .orient("left")
                .tickValues(yScale.domain().filter(function (d, i) {
                    return !(i % 10);
                }));
            svg.append("g")
                .attr("class", "x axis")
                .attr("transform", "translate(0," + height + ")")
                .call(xAxis);

            svg.append("g")
                .attr("class", "y axis")
                .call(yAxis);

            svg.selectAll("rect")
                .data(d3.zip(dataset.keys(), dataset.values().map(function (d) {
                    return d.length;
                })))
                .enter()
                .append("rect")
                .attr("class", "bar")
                .attr("x", function (d, i) {
                    var width = xScale(d[1]);
                    return xCenter - (width/2);
                })
                .attr("y", function (d) {
                    return yScale(d[0]);
                })
                .attr("height", yScale.rangeBand())
                .attr("width", function (d) {
                    return xScale(d[1]);
                });

            /*
             var keys = dataset.keys();
             var maxKey = keys[keys.length - 1];

             yScale.domain([0, maxKey])
             .range([0, height]);

             console.log(yScale.domain()[0] + ", " + yScale.domain()[1]);
             console.log(yScale.range()[0] + ", " + yScale.range()[1]);

             xScale.domain([0, d3.max(dataset.values().map(function (d) {
             return d.length;
             }))])
             .range([0, width]);

             xAxis.scale(xScale)
             .orient("bottom");

             yAxis.scale(yScale)
             .orient("left");

             svg.append("g")
             .attr("class", "x axis")
             .attr("transform", "translate(0," + height + ")")
             .call(xAxis);

             svg.append("g")
             .attr("class", "y axis")
             .call(yAxis);
             /*
             var line = d3.svg.line()
             .x(function (d) {
             return xScale(d[1]);
             }).
             y(function (d) {
             return yScale((parseInt(d[0])));
             });

             var test = d3.zip(dataset.keys(), dataset.values().map(function (d) {
             return d.length
             }));
             */
            /*
             svg.selectAll("circle")
             .data(test)
             .enter()
             .append("circle")
             .attr({
             cx: function (d, i) {
             return xScale(d[1]);
             },
             cy: function (d, i) {
             return yScale(d[0]);
             },
             r: 1.0
             })
             .style({
             stroke: "black"
             });


             svg.append("svg:path").attr(
             {
             d: function (d) {
             return line(test);
             }
             })
             .style({
             "stroke-width": 2,
             "stroke": "steelblue",
             "fill": "none"
             });

             */
        });


    }

    return {
        link: link,
        restrict: 'E'
    };
});
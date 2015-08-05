/**
 * Copyright (c) Ethan Kerzner 2015
 */

myApp.directive('childDepthPlot', function () {

    /* Member variables */

    var self = this;

    self.colors = ["#a6cee3", "#1f78b4", "#b2df8a", "#33a02c", "#fb9a99", "#e31a1c", "#fdbf6f",
        "#ff7f00", "#cab2d6", "#6a3d9a"];

    self.numDatasets = 0;

    self.margin = {top: 20, right: 20, bottom: 30, left: 150};

    self.svg = null;

    self.xScale = null;

    self.yScale = null;

    self.width = 960 - self.margin.left - self.margin.right;

    self.smallMultipleWidth = 0;
    
    self.height = 680 - self.margin.top - self.margin.bottom;
    /* Member stuff */

    self.addData = function (name, dataset) {
        var currIndex = self.numDatasets++;
        var currColor = self.colors[currIndex];

        var line = d3.svg.line()
            .x(function (d) {
                return self.xScale(d[1]);
            }).
            y(function (d) {
                return self.yScale((parseInt(d[0])));
            });

        var test = d3.zip(dataset.keys(), dataset.values().map(function (d) {
            return d.length
        }));


        self.svg.selectAll("circle")
            .data(test)
            .enter()
            .append("circle")
            .attr({
                cx: function (d, i) {
                    return self.xScale(d[1]);
                },
                cy: function (d, i) {
                    return self.yScale(d[0]);
                },
                r: 1.0
            })
            .style({
                stroke: "black"
            });


        self.svg.append("svg:path").attr(
            {
                d: function (d) {
                    return line(test);
                }
            })
            .style({
                "stroke-width": 2,
                "stroke": currColor,
                "fill": "none"
            });

    };

    self.createLegend = function () {

    };

    // Initializes yScale and xScale
    self.initializeScales = function (childDepthCount) {

        var yMax = 0;
        var xMax = 0;

        childDepthCount.forEach(function(key, value) {
            var depths = value.keys();
            var currY = depths[depths.length - 1];

            var currX = d3.max(value.values().map(function(d) {
                return d.length;
            }));

            yMax = currY > yMax ? currY : yMax;
            xMax = currX > xMax ? currX : xMax;
        } );

        self.yScale = d3.scale.linear();
        self.xScale = d3.scale.linear();

        self.yScale.domain([0, yMax])
            .range([0, self.height]);


        self.xScale.domain([0, xMax])
            .range([0, self.width]);
    };

    /* Angular shit */

    function link(scope, el, attr) {

        var xAxis = d3.svg.axis();
        var yAxis = d3.svg.axis();

        self.svg = d3.select(el[0]).append('svg')
            .attr("width", self.width + self.margin.left + self.margin.right)
            .attr("height", self.height + self.margin.top + self.margin.bottom)
            .append("g")
            .attr("transform", "translate(" + self.margin.left + "," + self.margin.top + ")");

        scope.$watch('childDepthCount', function (childDepthCount) {

            if (!childDepthCount)
                return;

            // Clear svg.
            self.svg.selectAll("*").remove();

            self.numDatasets = 0;

            self.initializeScales(childDepthCount);

            xAxis.scale(self.xScale)
                .orient("bottom");

            yAxis.scale(self.yScale)
                .orient("left");

            self.svg.append("g")
                .attr("class", "x axis")
                .attr("transform", "translate(0," + self.height + ")")
                .call(xAxis);

            self.svg.append("g")
                .attr("class", "y axis")
                .call(yAxis);

            childDepthCount.forEach(function(key, value) {
                self.addData(key, value);
            });
        });
    }


    return {
        link: link,
        restrict: 'E'
    };
});
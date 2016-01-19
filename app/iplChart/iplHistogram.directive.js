(function () {
    'use strict';

    angular.module('app.iplChartModule')
        .directive('iplHistogram', iplHistogram);

    iplHistogram.$inject = ['$log', 'visUtils'];

    function iplHistogram($log, visUtils) {

        return {
            scope: {
                value: '=',
                maxValue: '=',
                histogram: '=',
                width: '=',
                height: '=',
                chartData: '=',
                domain: '=', /* these are x-axis. angular doesn't like that name for binding*/
                range: '=',
                yAxisRange: '=',
                yAxisDomain: '=',
                numBins: '='
            },
            link: link,
            restrict: 'E'
        };

        function getMargins(width, height) {
            var margin = {};
            margin.left = width * (1.0 / 8.0);
            margin.right = width * (1.0 / 8.0);
            margin.top = height * (1.0 / 8.0);
            margin.bottom = height * (1.0 / 8.0);
            return margin;
        }

        function link(scope, element, attribute) {
            var self = {};

            scope.$watch('chartData', cellsChanged);

            self.svg = d3.select(element[0])
                .append('svg')
                .attr('width', scope.width)
                .attr('height', scope.height)
                .append('g');

            visUtils.clearGroup(svg);

            cellsChanged();

            function cellsChanged() {

                visUtils.clearGroup(self.svg);

                var width = scope.width;
                var height = scope.height;
                var margin = getMargins(width, height);

                visUtils.addOutlineToGroup(self.svg, width, height, '#222222');

                self.svg.append('text')
                    .text(scope.value)
                    .attr('text-anchor', 'start')
                    .attr('x', '5')
                    .attr('y', '15');


                var group = self.svg.append('g')
                    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');


                var x = d3.scale.linear()
                    .domain(scope.domain)
                    .range([0, width - margin.left - margin.right]);


                var y = d3.scale.linear()
                    .domain(scope.yAxisDomain)
                    .range([margin.bottom, height - (margin.top)]);

                var xAxis = d3.svg.axis()
                    .scale(x)
                    .orient("bottom")
                    .tickValues(scope.domain);

                var yAxis = d3.svg.axis()
                    .scale(y)
                    .orient('left')
                    .tickFormat(function (d) {
                        return d;
                    }).ticks(10);

                group.append('g')
                    .attr({
                        class: 'y axis',
                        'font-size': '9px',
                        'transform': 'translate(0,' + (-margin.bottom) + ')'
                    })
                    .call(yAxis);


                // Create x axis
                group.append("g")
                    .attr("class", "x axis")
                    .attr("transform", "translate(0," + (height - margin.bottom - margin.top) + ")")
                    .attr({
                        'font-size': '9px'
                    })
                    .call(xAxis);

                var justValues = scope.chartData.map(function (d) {
                    return d.result.percent;
                });

                // Stitch values back into bins.
                var data = d3.layout.histogram()
                    .range(scope.yAxisDomain)
                    .bins(y.ticks(scope.numBins))
                    (justValues);

                for (var i = 0; i < data.length; ++i) {
                    var currData = data[i];
                    var currDetails = [];

                    for (var j = 0; j < currData.length; ++j) {
                        for (var k = 0; k < scope.chartData.length; ++k) {
                            var currDistance = scope.chartData[k].result.percent;
                            if (currDistance == currData[j]) {
                                currDetails.push(scope.chartData[k]);
                            }
                        }
                        currData.details = currDetails;
                    }
                }

                // Create bars.
                var bar = group.selectAll(".histogramBar")
                    .data(data)
                    .enter()
                    .append("g")
                    .attr("transform", function (d) {
                        return "translate(" + 0.5 + "," + (y(d.x) - margin.bottom) + ")";
                    });

                var yRange = Math.abs(margin.bottom - (height - (margin.top)));

                bar.append("rect")
                    .attr("x", 0)
                    .attr("height", function (d) {
                        return (yRange / data.length) - 0.5;
                    })
                    .attr('width', function (d) {
                        return x(d.length);
                    })
                    .attr('fill', 'black')
                    .attr("class", "histogramBar")
                    .on('click', null);
            }
        }

    }
})();
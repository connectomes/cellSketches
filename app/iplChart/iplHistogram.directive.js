(function () {
    'use strict';

    angular.module('app.iplChartModule')
        .directive('iplHistogram', iplHistogram);

    iplHistogram.$inject = ['$log', 'visUtils', 'iplChartData'];

    function iplHistogram($log, visUtils, iplChartData) {

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
                numBins: '=',
                toggle: '=',
                numTicks: '=',
                label: '='
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

            //scope.$watch('chartData', cellsChanged);
            scope.$watch('toggle', cellsChanged);
            self.svg = d3.select(element[0])
                .append('svg')
                .attr('width', scope.width)
                .attr('height', scope.height)
                .append('g');

            visUtils.clearGroup(self.svg);

            cellsChanged();

            function cellsChanged() {
                $log.debug('iplHistogram - cellsChanged', scope);

                visUtils.clearGroup(self.svg);
                var width = scope.width;
                var height = scope.height;
                var margin = getMargins(width, height);

                visUtils.addOutlineToGroup(self.svg, width, height, '#222222');

                self.svg.append('text')
                    .text(scope.value + " - " + scope.label)
                    .attr('text-anchor', 'start')
                    .attr('x', '5')
                    .attr('y', '15');

                var group = self.svg.append('g')
                    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

                var x = d3.scale.linear()
                    .domain(scope.domain)
                    .range(scope.range);

                var y = d3.scale.linear()
                    .domain(scope.yAxisDomain)
                    .range(scope.yAxisRange);

                var xAxis = d3.svg.axis()
                    .scale(x)
                    .orient("bottom")
                    .tickValues(scope.domain);

                var format = d3.format("1%");

                var yAxis = d3.svg.axis()
                    .scale(y)
                    .orient('left')
                    .tickFormat(function (d) {
                        // Return integers or round to 2 decimal places
                        if (Math.round(d) == d) {
                            return d;
                        } else if (Math.abs(d - 0.0) < 0.001) {
                            return "0.00";
                        } else {
                            return d.toFixed(2);
                        }
                    })
                    .ticks(10);

                var yAxisTicks = d3.svg.axis()
                    .scale(y)
                    .orient('left')
                    .ticks(scope.numTicks)
                    .tickSize(-(scope.width - margin.left - margin.right))
                    .tickFormat(function (d) {
                        return;
                    });


                // Create x axis
                group.append("g")
                    .attr("class", "x axis")
                    .attr("transform", "translate(0," + (height - margin.bottom - margin.top) + ")")
                    .attr({
                        'font-size': '9px'
                    })
                    .call(xAxis);

                var data = iplChartData.getHistogramBins(scope.chartData, scope.numBins, scope.yAxisDomain, scope.yAxisRange);

                for (var i = 0; i < data.length; ++i) {
                    var currData = data[i];
                    var currDetails = [];

                    for (var j = 0; j < currData.length; ++j) {
                        for (var k = 0; k < scope.chartData.length; ++k) {
                            var currDistance = scope.chartData[k].percent;
                            if (currDistance == currData[j]) {
                                currDetails.push(scope.chartData[k]);
                            }
                        }
                        currData.details = currDetails;
                    }
                }

                var yRange = Math.abs(height - (margin.bottom + margin.top));

                var bar = group.selectAll(".iplHistogramBar")
                    .data(data)
                    .enter()
                    .append("g")
                    .attr("transform", function (d, i) {
                        return "translate(" + 0.5 + "," + ((yRange / (data.length)) * i) + ")";
                    });

                bar.append("rect")
                    .attr("x", 0)
                    .attr("height", function (d) {
                        return (yRange / (data.length + 1));
                    })
                    .attr('width', function (d) {
                        return x(d.length);
                    })
                    .attr("class", "iplHistogramBar")
                    .on('click', function (d) {
                        $log.warn(d);
                    });

                group.append('g')
                    .attr({
                        class: 'y axis',
                        'font-size': '9px',
                        'transform': 'translate(0,0)'
                    })
                    .call(yAxis);

                group.append('g')
                    .attr({
                        class: 'y-axis-ticks',
                        'font-size': '9px',
                        'transform': 'translate(0,0)'
                    })
                    .call(yAxisTicks);

            }
        }

    }
})();
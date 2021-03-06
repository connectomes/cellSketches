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
                label: '=',
                supposedToUseMesh: '=',
                hoverIndex: '=',
                onUpdateHover: '&'
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
            scope.$watch('hoverIndex', hoverIndexChanged);

            self.svg = d3.select(element[0])
                .append('svg')
                .attr("id", scope.value)
                .attr('width', scope.width)
                .attr('height', scope.height)
                .append('g');

            var div = d3.select(element[0]).append("div")
                .attr("class", "tooltip")
                .style("opacity", 0);

            visUtils.clearGroup(self.svg);

            cellsChanged();

            function cellsChanged() {

                $log.debug('iplHistogram - cellsChanged', scope);

                visUtils.clearGroup(self.svg);
                var width = scope.width;
                var height = scope.height;
                var margin = getMargins(width, height);

                d3.select(element[0])
                    .select("svg")
                    .attr("id", 'conversion-' + scope.value + '-' + scope.$parent.$parent.model.ui.selectedVerticalAxisMode.name);

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

                var yAxisDomain = [Math.min(scope.yAxisDomain[0], 0), scope.yAxisDomain[1]];
                var y = d3.scale.linear()
                    .domain(yAxisDomain)
                    .range(scope.yAxisRange);

                var xAxis = d3.svg.axis()
                    .scale(x)
                    .orient("bottom")
                    .tickValues(scope.domain);

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
                var allPointsUsedMesh = true;

                var isPointAdded = [];
                var numPointsWithoutMesh = 0;
                for (var i = 0; i < data.length; ++i) {
                    var currData = data[i];
                    var currDetails = [];

                    for (var j = 0; j < currData.length; ++j) {
                        for (var k = 0; k < scope.chartData.length; ++k) {
                            var currDistance = scope.chartData[k].value;
                            if ((isPointAdded[k] == undefined) && currDistance == currData[j]) {
                                isPointAdded[k] = true;
                                currDetails.push(scope.chartData[k]);
                                allPointsUsedMesh &= scope.chartData[k].usedMesh;
                                if (!scope.chartData[k].usedMesh) {
                                    numPointsWithoutMesh++;
                                }
                            }
                        }
                        currData.details = currDetails;
                    }
                }

                self.percentPointsWithoutMesh = (numPointsWithoutMesh / scope.chartData.length) * 100;


                if (scope.supposedToUseMesh && !allPointsUsedMesh) {
                    self.svg.append('circle')
                        .attr('text-anchor', 'end')
                        .attr('cx', 10)
                        .attr('cy', 25)
                        .attr('r', 3)
                        .attr("fill", "lightgrey")
                        .on("mouseover", onConversionMarkMouseOver)
                        .on("mouseout", onConversionMarkMouseOut)
                }

                var yRange = Math.abs(height - (margin.bottom + margin.top));

                var bar = group.selectAll(".iplHistogramBar")
                    .data(data)
                    .enter()
                    .append("rect")
                    .attr("transform", function (d, i) {
                        return "translate(" + 0.5 + "," + ((yRange / (data.length)) * i) + ")";
                    })
                    .attr("x", 0)
                    .attr("height", function (d) {
                        return (yRange / (data.length + 1));
                    })
                    .attr('width', function (d) {
                        return x(d.length);
                    })
                    .attr("class", "iplHistogramBar")
                    .on('click', onHistogramBarClicked)
                    .on('mouseover', onHistogramBarMouseOver)
                    .on('mouseout', onHistogramBarMouseOut);

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

            function onConversionMarkMouseOver() {
                div.transition()
                    .duration(200)
                    .style("opacity", .9);
                div.html(self.percentPointsWithoutMesh.toFixed(2) + "% of the points were converted using a weighted average instead of mesh intersection.")
                    .style("left", (d3.event.pageX) + 10 + "px")
                    .style("top", (d3.event.pageY) + 5 + "px");
            }

            function onConversionMarkMouseOut() {
                div.transition()
                    .duration(500)
                    .style("opacity", 0);
            }

            function onHistogramBarMouseOver(d, i) {
                scope.onUpdateHover({index: i});
            }

            function onHistogramBarClicked(d, i) {
                $log.warn(d.details.length);
            }

            function onHistogramBarMouseOut(d, i) {
                scope.onUpdateHover({index: -1});
            }

            function hoverIndexChanged(newValue, oldValue) {
                if (newValue == oldValue) {
                    return;
                }
                if (newValue == -1) {
                    self.svg.selectAll(".iplHistogramBar")
                        .filter(function (d, i) {
                            return i == oldValue;
                        }).style("fill", "darkgrey");
                } else if (newValue != -1) {
                    self.svg.selectAll(".iplHistogramBar")
                        .filter(function (d, i) {
                            return i == newValue;
                        }).style("fill", "#FFC800");
                }
            }
        }

    }
})();
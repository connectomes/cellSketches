(function () {
    'use strict';

    angular
        .module('app.visModule')
        .factory('visBarChart', visBarChart);

    visBarChart.$inject = ['$log'];

    function visBarChart($log) {

        return {
            BarChartD3: BarChartD3
        };

        function BarChartD3() {

            var self = this;

            self.yScale = d3.scale.ordinal();
            self.yAxis = d3.svg.axis();
            self.paddingLeftPercent = 0.15;
            self.paddingBottomPercent = 0.10;
            self.paddingTopPercent = 0.1;

            self.activate = function (group, title, width, height, targets, chartData, xAxisMax, clickCallbackFn) {
                group.append('g')
                    .attr('transform', 'translate(' + (width - 5) + ', 14)')
                    .append('text')
                    .text(title)
                    .style('font-size', '12px')
                    .style('text-anchor', 'end');

                self.bars = group.append('g');

                self.yScale = createYScale(targets, height, self.paddingTopPercent, self.paddingBottomPercent);
                self.yAxis = createYAxis(group, self.yScale, self.paddingLeftPercent, width, customAxis);

                self.xScale = createXScale(xAxisMax, width, self.paddingLeftPercent);
                self.xAxis = createXAxis(group, self.xScale, self.paddingLeftPercent, self.paddingBottomPercent, width, height);

                var barData = [];
                for (var i = 0; i < targets.length; ++i) {
                    var bar = {};
                    bar.name = targets[i];
                    bar.values = chartData[targets[i]];
                    bar.cellId = title;
                    barData.push(bar);
                }

                self.bars.selectAll('.bar')
                    .data(barData)
                    .enter()
                    .append('rect')
                    .attr('class', 'bar')
                    .attr('y', function (d) {
                        return self.yScale(d.name) + 2;
                    })
                    .attr('x', width * self.paddingLeftPercent)
                    .attr('width', function (d) {
                        return self.xScale(d3.max([0, d.values.values.length]));
                    })
                    .attr('height', function (d) {
                        return self.yScale.rangeBand() - 4;
                    }).attr('rx', 3)
                    .on('click', clickCallbackFn);

            };

            function createXScale(xAxisMax, width, paddingLeftPercent) {
                var xScale = d3.scale.linear();
                xScale.domain([0, xAxisMax])
                    .range([0, width * (1 - paddingLeftPercent)]);
                return xScale;
            }

            function createYScale(targets, height, paddingTopPercent, paddingBottomPercent) {
                var yScale = d3.scale.ordinal();
                yScale.domain(targets)
                    .rangeBands([height * paddingTopPercent, height * (1 - paddingBottomPercent)]);

                return yScale;
            }

            function createXAxis(group, xScale, paddingLeftPercent, paddingBottomPercent, width, height, customAxisFn) {
                var xAxis = d3.svg.axis();
                xAxis.scale(xScale)
                    .orient('bottom');

                group.append('g')
                    .attr({
                        transform: 'translate(' + (paddingLeftPercent * width) + ', ' + (height - (height * paddingBottomPercent)) + ')',
                        'font-size': '9px'
                    })
                    .call(xAxis);

                return xAxis;
            }

            function createYAxis(group, yScale, paddingLeftPercent, width, customAxisFn) {
                var yAxis = d3.svg.axis();
                yAxis.scale(yScale)
                    .orient('left');

                group.append('g')
                    .attr({
                        transform: 'translate(' + (paddingLeftPercent * width) + ', 0)',
                        'font-size': '9px'
                    })
                    .call(yAxis).call(customAxisFn);

                return yAxis;
            }

            function customAxis(g) {
                g.selectAll("text")
                    .attr("x", -2)
                    .attr("dy", 3);
            }

        }
    }

}());
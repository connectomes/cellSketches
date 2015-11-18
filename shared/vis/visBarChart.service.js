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
            self.paddingTopPercent = 0.025;

            self.activate = function(group, title, width, height, targets, chartData) {
                group.append('g')
                    .attr('transform', 'translate(' + (width - 5) + ', 14)')
                    .append('text')
                    .text(title)
                    .style('font-size', '12px')
                    .style('text-anchor', 'end');

                self.yScale = createYScale(targets, height, self.paddingTopPercent, self.paddingBottomPercent);
                self.yAxis = createYAxis(group, self.yScale, self.paddingLeftPercent, width, customAxis);
            };

            function createYScale(targets, height, paddingTopPercent, paddingBottomPercent) {
                var yScale = d3.scale.ordinal();
                yScale.domain(targets)
                    .rangeBands([height * paddingTopPercent, height * (1 - paddingBottomPercent)]);

                return yScale;
            }

            function createYAxis(group, yScale, paddingLeftPercent, width, customAxisFn) {
                var yAxis = d3.svg.axis();
                yAxis.scale(self.yScale)
                    .orient('left');

                group.append('g')
                    .attr({
                        transform: 'translate(' + (self.paddingLeftPercent * width) + ', 0)',
                        'font-size': '9px'
                    })
                    .call(yAxis).call(customAxis);

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
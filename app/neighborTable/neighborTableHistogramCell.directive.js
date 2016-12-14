(function () {
    'use strict';

    angular.module('app.neighborTableModule')
        .directive('neighborTableHistogramCell', neighborTableHistogramCell);

    neighborTableHistogramCell.$inject = ['$log'];

    function neighborTableHistogramCell($log) {

        return {
            scope: {
                values: '=',
                maxValue: '=',
                histogram: '=',
                id: '=',
                target: '=',
                childType: '='
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
            console.debug("link function");
            drawHistogram(scope, element);

            scope.$watch("values", function (newValue) {
                scope.values = newValue;
                drawHistogram(scope, element);
            });

            scope.$watch("id", function (newValue) {
                scope.id = newValue;
                drawHistogram(scope, element);
            });

        }

        function drawHistogram(scope, element) {
            console.debug("draw histogram");
            if (scope.values.length == 0) {
                return;
            }

            // TODO: move these to app scope.
            var width = 200;
            var height = 75;
            var margin = getMargins(width, height);

            d3.select(element[0]).selectAll("*").remove();
            // Create svg.
            var svg = d3.select(element[0])
                .append('svg');
            var id = '';
            if (scope.childType) {
                id = 'cell' + scope.id + '-' + scope.childType;
            } else {
                id = 'cell' + scope.id + '-' + scope.target;
            }
            svg.attr("id", id);
            svg = svg.append('g')
                .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');


            // Create scales
            var x = d3.scale.linear()
                .domain(scope.histogram.xAxisDomain)
                .range([0, width - margin.left - margin.right]);

            var y = d3.scale.linear()
                .domain(scope.histogram.yAxisDomain)
                .range([height, margin.bottom]);

            // Bin values
            var justValues = scope.values.map(function (d) {
                return d.value;
            });

            // Stitch values back into bins.
            var data = d3.layout.histogram()
                .range(scope.histogram.xAxisDomain)
                .bins(x.ticks(scope.histogram.numBins))
                (justValues);

            for (var i = 0; i < data.length; ++i) {
                var currData = data[i];
                var currDetails = [];

                // For each item in bin...
                for (var j = 0; j < currData.length; ++j) {
                    for (var k = 0; k < scope.values.length; ++k) {
                        var currDistance = scope.values[k].value;
                        if (currDistance == currData[j]) {
                            currDetails.push(scope.values[k]);
                        }
                    }
                    currData.details = currDetails;
                }
            }

            // Create y axis.
            var xAxis = d3.svg.axis()
                .scale(x)
                .orient("bottom")
                .tickValues(scope.histogram.xAxisDomain);

            var yAxis = d3.svg.axis()
                .scale(y)
                .orient('left')
                .tickFormat(function (d) {
                    return d;
                }).ticks(4);

            svg.append('g')
                .attr({
                    class: 'y axis',
                    'font-size': '9px',
                    'transform': 'translate(0,' + (-margin.bottom) + ')'
                })
                .call(yAxis);

            // Create x axis
            svg.append("g")
                .attr("class", "x axis")
                .attr("transform", "translate(0," + (height - margin.bottom) + ")")
                .attr({
                    'font-size': '9px'
                })
                .call(xAxis);

            // Create bars.
            var bar = svg.selectAll(".histogramBar")
                .data(data)
                .enter()
                .append("g")
                .attr("transform", function (d) {
                    return "translate(" + x(d.x) + "," + ((y(d.y) - 0.5) - margin.bottom) + ")";
                });

            bar.append("rect")
                .attr("x", 1)
                .attr("width", x(data[0].dx) - 1)
                .attr('height', function (d) {
                    return height - y(d.y);
                })
                .attr("class", "histogramBar")
                .on('click', null);

            /*
             var nonZeroFill = '#D0D0D0';
             var valueBarFill = '#707070';
             var horizontalPadding = 4;

             scope.$watch('values', onValuesChanged, true);
             scope.$watch('highlight', onHighlightChanged, true);
             var self = {};


             svg.on('mouseover', function() {
             if (self.text) {
             self.text.style('display', 'block');
             }
             });

             svg.on('mouseout', function() {
             if(self.text) {
             self.text.style('display', 'none');
             }
             });

             if (scope.values.length > 0) {
             drawRects(scope, horizontalPadding, valueBarFill, nonZeroFill);
             }

             function onHighlightChanged(newValue, oldValue) {

             if (newValue) {

             if (d3.select(element[0].parentNode)
             .style('background-color') != 'rgb(255, 100, 0)') {

             d3.select(element[0].parentNode)
             .style('background-color', '#FFC800');

             }
             } else if (oldValue) {

             d3.select(element[0].parentNode)
             .style('background-color', '');
             }
             }

             function onValuesChanged(newValue, oldValue) {
             svg.selectAll('rect').remove();
             if (scope.values.length > 0) {
             drawRects(scope, horizontalPadding, valueBarFill, nonZeroFill);
             }
             }

             function drawRects(scope, horizontalPadding, valueBarFill, nonZeroFill) {

             var rect = svg.append('rect')
             .attr('width', scope.width - horizontalPadding * 2)
             .attr('height', 20)
             .style('fill', nonZeroFill)
             .attr('x', horizontalPadding)
             .style('rx', 2)
             .style('ry', 2);

             self.fill = svg.append('rect')
             .attr('width', 2 + (scope.width - (horizontalPadding * 2) - 2) * scope.fraction)
             .attr('height', 20)
             .style('fill', valueBarFill)
             .attr('x', horizontalPadding)
             .style('rx', 2)
             .style('ry', 2);

             self.text = svg.append('text')
             .text(scope.values.length)
             .style('text-anchor', 'middle')
             .style('alignment-baseline', 'hanging')
             .attr('x', scope.width / 2)
             .attr('y', 5)
             .style('fill', 'white')
             .style('display', 'none');
             }
             */
        }
    }
})();
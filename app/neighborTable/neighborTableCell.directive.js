(function () {
    'use strict';

    angular.module('app.neighborTableModule')
        .directive('neighborTableCell', neighborTableCell);

    function neighborTableCell() {

        return {
            scope: {
                values: '=',
                fraction: '=',
                width: '=',
                highlight: '='
            },
            link: link,
            restrict: 'E'
        };

        function link(scope, element, attribute) {

            var nonZeroFill = '#D0D0D0';
            var valueBarFill = '#707070';
            var horizontalPadding = 4;

            scope.$watch('values', onValuesChanged, true);
            scope.$watch('highlight', onHighlightChanged, true);
            var self = {};

            var svg = d3.select(element[0]).append('svg');

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
                    .attr('x', scope.width / 2)
                    .attr('y', 15)
                    .style('fill', 'white')
                    .style('display', 'none');
            }
        }
    }
})();
(function () {
    'use strict';

    angular.module('app.csvUpload')
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
            if (scope.values.length > 0) {
               drawRects(scope, horizontalPadding, valueBarFill, nonZeroFill);
            }

            function onHighlightChanged(newValue, oldValue) {
                console.log('highlight changed');
                if(newValue) {
                    self.fill.style('fill', '#101010');
                } else if(oldValue) {
                    self.fill.style('fill', valueBarFill);
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
                    .attr('x', horizontalPadding);

                self.fill = svg.append('rect')
                    .attr('width', (scope.width - (horizontalPadding * 2)) * scope.fraction)
                    .attr('height', 20)
                    .style('fill', valueBarFill)
                    .attr('x', horizontalPadding);

                svg.append('text')
                    .text(scope.values.length);
            }
        }
    }
})();
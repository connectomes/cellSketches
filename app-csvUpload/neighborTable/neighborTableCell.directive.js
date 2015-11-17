(function () {
    'use strict';

    angular.module('app.csvUpload')
        .directive('neighborTableCell', neighborTableCell);

    function neighborTableCell() {

        return {
            scope: {
                values: '=',
                fraction: '=',
                width: '='
            },
            link: link,
            restrict: 'E'
        };

        function link(scope, element, attribute) {

            var nonZeroFill = '#D0D0D0';
            var valueBarFill = '#707070';
            var horizontalPadding = 4;

            scope.$watch('values',onValuesChanged, true);

            var svg = d3.select(element[0]).append('svg');
            if (scope.values.length > 0) {
               drawRects(scope, horizontalPadding, valueBarFill, nonZeroFill);
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

                svg.append('rect')
                    .attr('width', (scope.width - (horizontalPadding * 2)) * scope.fraction)
                    .attr('height', 20)
                    .style('fill', valueBarFill)
                    .attr('x', horizontalPadding);
            }
        }
    }
})();
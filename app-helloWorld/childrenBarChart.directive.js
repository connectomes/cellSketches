(function () {
    'use strict';

    angular.module('app.helloWorld')
        .directive('childrenBarChart', childrenBarChart);

    childrenBarChart.$inject = ['volumeCells'];

    function childrenBarChart(volumeCells) {

        return {
            link: link,
            restrict: 'EA'
        };

        function link(scope, element, attrs) {

            var svgWidth = 600;
            var svgHeight = 400;
            console.log("hello bar chart!");
            console.log(volumeCells.getNumCells());

            var svg = d3.select(element[0]).
                append('svg').attr({
                    width: svgWidth,
                    height: svgHeight
                });

            svg = svg.append('g');

            var mainGroup = svg.append('g').
                attr({
                    'transform': 'translate(' + 0 + ',' + 0 + ')'
                });

            addOutlineToGroup(mainGroup, svgWidth, svgHeight);
        }
    }

})();
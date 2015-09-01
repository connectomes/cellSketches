/**
 * Copyright (c) Ethan Kerzner 2015
 */

myApp.directive('cellSelection', cellSelection);

function cellSelection(volumeCells) {


    return {
        link: link,
        restrict: 'EA'
    };

    function link(scope, element, attrs) {

        var svg;
        var svgWidth = 180;
        var svgHeight = 1280;

        svg = d3.select(element[0]).
            append('svg').attr({width: svgWidth, height: svgHeight});

        svg = svg.append('g');
        svg.attr('transform', 'translate(10,10)');

        scope.$on('loadedCellsChanged', cellsChanged);


        function cellsChanged() {

            var loadedCells = volumeCells.getLoadedCellIds();
            svg.selectAll('g').remove();
            svg.selectAll('g')
                .data(loadedCells)
                .enter()
                .append('g')
                .attr({
                    transform: function (d, i) {
                        return 'translate(' + 20 + ', ' + (30 + i * 30) + ')';
                    }
                });

            var groups = svg.selectAll('g');

            groups.append('text')
                .text(function (d) {
                    return d;
                })
                .style({
                    'text-anchor': 'start',
                    'vertical-align': 'top'
                }).attr(
                {
                    x: 0,
                    y: 0,
                    dy: "0.80em"
                });

            groups.append('svg:image')
                .datum(function(d) {return d;})
                .attr(
                {
                    width: 15,
                    height: 15,
                    fill: 'black',
                    x: 50,
                    y: 0,
                    'xlink:href': 'assets/trash.svg'
                }).on('click', cellRemovedClicked);

            function cellRemovedClicked(d) {
                console.log('cell removed clicked: ' + d);
                scope.cellRemoved(d);
            }
        }
    }
}
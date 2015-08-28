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
        var m_svg;
        var svgWidth = 180;
        var svgHeight = 1280;

        m_svg = d3.select(element[0]).
            append('svg').attr({width: svgWidth, height: svgHeight});

        m_svg = m_svg.append('g');
        m_svg.attr('transform', 'translate(10,10)');

        scope.$on('loadedCellsChanged', cellsChanged);


        function cellsChanged() {

            var loadedCells = volumeCells.getLoadedCellIds();

            m_svg.selectAll('g')
                .data(loadedCells)
                .enter()
                .append('g')
                .attr({
                    transform: function(d, i) {
                        return 'translate(' + 20 + ', ' + (30 + i * 30) + ')';
                    }
                });

            var groups = m_svg.selectAll('g');
            groups.append('text').text(function(d) { return d; })
        }
    }
}
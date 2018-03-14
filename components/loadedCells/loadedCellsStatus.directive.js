(function () {
    'use strict';

    angular.module('app.loadedCellsModule')
        .directive('loadedCellsStatus', loadedCellsStatus);

    loadedCellsStatus.$inject = ['$log', 'loadedCellsData'];
    function loadedCellsStatus($log, loadedCellsData) {

        return {
            scope: {
                status: '='
            },
            link: link,
            restrict: 'E'
        };

        function link(scope, element, attribute) {

            var svg = d3.select(element[0]).append('svg');

            scope.$watch('status', onStatusChanged, true);
            var loader = Loader({width: 75, height: 25, id: "loader"});
            loader();

            function onStatusChanged(newValue, oldValue) {
                if (newValue == loadedCellsData.Status.OK) {

                    svg.selectAll('*').remove();
                    var group = svg.append("g")
                        .attr("transform", "translate(22.5,2)");

                    // This path is from https://www.iconfinder.com/icons/103184/check_checkmark_ok_yes_icon#size=20
                    var checkPath = "M21.652,3.211c-0.293-0.295-0.77-0.295-1.061,0L9.41,14.34  c-0.293,0.297-0.771,0.297-1.062,0L3.449,9.351C3.304,9.203,3.114,9.13,2.923,9.129C2.73,9.128,2.534,9.201,2.387,9.351  l-2.165,1.946C0.078,11.445,0,11.63,0,11.823c0,0.194,0.078,0.397,0.223,0.544l4.94,5.184c0.292,0.296,0.771,0.776,1.062,1.07  l2.124,2.141c0.292,0.293,0.769,0.293,1.062,0l14.366-14.34c0.293-0.294,0.293-0.777,0-1.071L21.652,3.211z";

                    group.append('path')
                        .attr("d", checkPath)
                        .attr('fill-rule', 'evenodd')
                        .style('fill', '#4D4D4D')
                        .style('stroke', '#4D4D4D');

                } else if (newValue == loadedCellsData.Status.ERROR) {

                    // In this case the row will be deleted by the table. We don't do anything here.

                }

            }

            // This is from http://bl.ocks.org/MattWoelk/6132258
            function Loader(config) {
                return function () {
                    var radius = Math.min(config.width, config.height) / 2;
                    var tau = 2 * Math.PI;

                    var arc = d3.svg.arc()
                        .innerRadius(radius * 0.5)
                        .outerRadius(radius * 0.9)
                        .startAngle(0);

                    var group = svg.append("g")
                        .attr("transform", "translate(" + config.width / 2 + "," + config.height / 2 + ")");

                    var background = group.append("path")
                        .datum({endAngle: 0.33 * tau})
                        .style("fill", "#4D4D4D")
                        .attr("d", arc)
                        .call(spin, 1500);

                    function spin(selection, duration) {
                        selection.transition()
                            .ease("linear")
                            .duration(duration)
                            .attrTween("transform", function () {
                                return d3.interpolateString("rotate(0)", "rotate(360)");
                            });

                        setTimeout(function () {
                            spin(selection, duration);
                        }, duration);
                    }

                }
            }

        }

    }

})();
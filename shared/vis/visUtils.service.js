(function () {
    'use strict';

    angular
        .module('app.visModule')
        .factory('visUtils', visUtils);

    visUtils.$inject = ['$log'];

    function visUtils($log) {

        var self = this;

        self.svgWidth = 1350;
        self.svgHeight = 400;

        self.mainHeight = 500;
        self.mainPadding = 10;
        self.mainWidth = self.svgWidth - self.mainPadding;
        self.detailsHeight = 250;

        var service = {
            addOutlineToGroup: addOutlineToGroup,
            computeGridPosition: computeGridPosition,
            convertToTranslateString: convertToTranslateString,
            clearGroup: clearGroup,
            createDetailsGroup: createDetailsGroup,
            createMainGroup: createMainGroup,
            createSvg: createSvg,
            getSvgWidth: getSvgWidth
        };

        return service;

        function addOutlineToGroup(group, width, height, stroke) {
            group.append('rect')
                .attr({
                    width: width,
                    height: height,
                    fill: 'none',
                    stroke: stroke,
                    'stroke-width': '2px'
                });
        }

        function createDetailsGroup(svg) {
            var group = svg.append('g')
                .attr({
                    'transform': convertToTranslateString(self.mainPadding / 2, self.mainPadding + self.mainHeight)
                });
            addOutlineToGroup(group, self.mainWidth, self.detailsHeight);
            return group;
        }

        function convertToTranslateString(x, y) {
            return 'translate(' + x + ',' + y + ')';
        }

        function computeGridPosition(i, rowSize) {
            if (i < rowSize) {
                return new utils.Point2D(i, 0);
            } else {
                var row = Math.floor(i / rowSize);
                var col = i % rowSize;
                return new utils.Point2D(col, row);
            }
        }

        function clearGroup(group) {
            group.selectAll('*')
                .remove();
        }

        function createMainGroup(svg) {
            var group = svg.append('g')
                .attr({
                    'transform': convertToTranslateString(self.mainPadding / 2, self.mainPadding / 2)
                });
            addOutlineToGroup(group, self.mainWidth, self.mainHeight);
            return group;
        }

        function createSvg(element, callback) {
            var svg = d3.select(element)
                .append('svg')
                .attr({
                    width: self.svgWidth,
                    height: self.svgHeight
                })
                .on('click', callback);
            return svg;

        }

        function getSvgWidth() {
            return self.svgWidth;
        }

    }

}());
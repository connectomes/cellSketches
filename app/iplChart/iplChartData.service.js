(function () {
    'use strict';

    angular
        .module('app.iplChartModule')
        .factory('iplChartData', iplChartData);

    iplChartData.$inject = ['$log', 'volumeCells', 'volumeLayers'];

    function iplChartData($log, volumeCells, volumeLayers) {

        var self = this;

        self.IplModes = {
            DEPTH: 0,
            IPL: 1
        };

        var service = {
            getAsCsv: getAsCsv,
            getIplChartData: getIplChartData,
            getIplRange: getIplRange,
            getHistogramMaxItemsInBins: getHistogramMaxItemsInBins,
            getHistogramBins: getHistogramBins
        };

        service.IplModes = self.IplModes;

        return service;

        function getAsCsv(cellIndexes, chartData) {
            var csv = 'cellId, locationId, locationZ, %ipl';
            cellIndexes.forEach(function(cellIndex, i) {
                var cellId = volumeCells.getCellAt(cellIndex).id;
                chartData[i].forEach(function(result) {
                    csv += '\n'
                    csv += cellId;
                    csv += ', ' + result.location.id;
                    csv += ', ' + result.location.position.z;
                    csv += ', ' + result.result.percent;
                });
            });
            return csv;
        }

        function getIplChartData(cellIndexes, iplMode) {

            var cellIds = [];
            cellIndexes.forEach(function (cellIndex) {
                cellIds.push(volumeCells.getCellAt(cellIndex).id);
            });


            var data = [];
            cellIds.forEach(function (cellId) {
                var cellData = [];
                var locations = volumeCells.getCellLocations(cellId);

                locations.forEach(function (location) {
                    var result = volumeLayers.convertToIPLPercent(location.position);
                    cellData.push({
                        value: (iplMode == self.IplModes.DEPTH) ? (location.position.z) : result.percent,
                        location: location,
                        result: result
                    });
                });

                data.push(cellData);
            });

            return data;

        }

        function getIplRange(data) {

            // IPL should be in the range (-0.5, 1.0)
            var minIpl = 1000000.0;
            var maxIpl = -1000000.0;

            data.forEach(function (results) {
                results.forEach(function (result) {
                    minIpl = Math.min(result.value, minIpl);
                    maxIpl = Math.max(result.value, maxIpl);
                });
            });

            return [minIpl, maxIpl];
        }

        function getHistogramBins(data, numBins, domain, range) {
            console.log(numBins);
            var scale = d3.scale.linear()
                .domain(domain)
                .range(range);

            var justValues = data.map(function (d) {
                return d.value;
            });

            return d3.layout.histogram()
                .range(domain)
                .bins(numBins)
                (justValues);
        }

        function getHistogramMaxItemsInBins(data, numBins, domain, range) {

            var maxItemsInBins = 0;

            data.forEach(function (results) {
                var bins = getHistogramBins(results, numBins, domain, range);
                bins.forEach(function (bin, i) {
                    maxItemsInBins = Math.max(bin.length, maxItemsInBins);
                });
            });

            return maxItemsInBins;
        }

    }
})();


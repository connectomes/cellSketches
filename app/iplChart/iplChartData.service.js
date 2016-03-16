(function () {
    'use strict';

    angular
        .module('app.iplChartModule')
        .factory('iplChartData', iplChartData);

    iplChartData.$inject = ['$log', 'volumeCells', 'volumeLayers'];

    function iplChartData($log, volumeCells, volumeLayers) {

        var self = this;

        self.IplModes = {
            DEPTH: 2,
            IPL: 0,
            NORMALIZED_DEPTH: 1
        };

        var service = {
            getAsCsv: getAsCsv,
            getIplChartData: getIplChartData,
            getIplRange: getIplRange,
            getHistogramMaxItemsInBins: getHistogramMaxItemsInBins,
            getHistogramBins: getHistogramBins
        };

        service.IplModes = self.IplModes;

        self.cachedData = [];

        return service;

        function getAsCsv(cellIndexes, chartData) {
            var csv = 'cellId, locationId, locationZ, %ipl';
            cellIndexes.forEach(function (cellIndex, i) {
                var cellId = volumeCells.getCellAt(cellIndex).id;
                chartData[i].forEach(function (result) {
                    csv += '\n'
                    csv += cellId;
                    csv += ', ' + result.location.id;
                    csv += ', ' + result.location.position.z;
                    csv += ', ' + result.percent;
                });
            });
            return csv;
        }

        function getIplChartData(cellIndexes, iplMode, useMesh, searchRadius) {

            var cellIds = [];
            cellIndexes.forEach(function (cellIndex) {
                cellIds.push(volumeCells.getCellAt(cellIndex).id);
            });


            var data = [];
            cellIds.forEach(function (cellId) {
                data.push(getOrCreateCellData(cellId, iplMode, useMesh, searchRadius));
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

        function getOrCreateCellData(cellId, iplMode, useMesh, searchRadius) {

            // Search for entry in the cache
            for (var i = 0; i < self.cachedData.length; ++i) {
                var cachedData = self.cachedData[i];
                if (cachedData.cellId == cellId
                    && cachedData.iplMode == iplMode
                    && cachedData.searchRadius == searchRadius
                    && cachedData.useMesh == useMesh) {
                    return cachedData.data;
                }
            }

            // Couldn't find entry. Compute values.
            var locations = volumeCells.getCellLocations(cellId);
            var cellData = [];

            locations.forEach(function (location) {

                var z = location.position.z;
                if (iplMode !== self.IplModes.DEPTH) {
                    z = volumeLayers.convertPoint(location.position, iplMode, useMesh, searchRadius);
                }
                cellData.push({
                    percent: z,
                    value: z,
                    location: location
                });
            });

            self.cachedData.push({
                cellId: cellId,
                iplMode: iplMode,
                searchRadius: searchRadius,
                useMesh: useMesh,
                data: cellData
            });

            return cellData;
        }

    }
})();


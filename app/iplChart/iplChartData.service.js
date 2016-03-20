(function () {
    'use strict';

    angular
        .module('app.iplChartModule')
        .factory('iplChartData', iplChartData);

    iplChartData.$inject = ['$log', 'volumeCells', 'volumeLayers'];

    function iplChartData($log, volumeCells, volumeLayers) {

        var self = this;

        self.VerticalAxisModes = {
            DEPTH: 2,
            PERCENT_DIFFERENCE: volumeLayers.ConversionModes.PERCENT_DIFFERENCE,
            NORMALIZED_DEPTH: volumeLayers.ConversionModes.NORMALIZED_DEPTH
        };

        var service = {
            getAsCsv: getAsCsv,
            getIplChartData: getIplChartData,
            getIplRange: getIplRange,
            getHistogramMaxItemsInBins: getHistogramMaxItemsInBins,
            getHistogramBins: getHistogramBins
        };

        service.VerticalAxisModes = self.VerticalAxisModes;

        self.cachedData = [];

        return service;

        function getAsCsv(cellIndexes, chartData) {
            var csv = 'cell id, location id, z, converted value';
            cellIndexes.forEach(function (cellIndex, i) {
                var cellId = volumeCells.getCellAt(cellIndex).id;
                chartData[i].forEach(function (result) {
                    csv += '\n';
                    csv += cellId;
                    csv += ', ' + result.location.id;
                    csv += ', ' + result.location.position.z;
                    csv += ', ' + result.value;
                });
            });
            return csv;
        }

        function getIplChartData(cellIndexes, verticalAxisMode, useMesh, searchRadius) {

            var cellIds = [];
            cellIndexes.forEach(function (cellIndex) {
                cellIds.push(volumeCells.getCellAt(cellIndex).id);
            });


            var data = [];
            cellIds.forEach(function (cellId) {
                data.push(getOrCreateCellData(cellId, verticalAxisMode, useMesh, searchRadius));
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

        function getOrCreateCellData(cellId, verticalAxisMode, useMesh, searchRadius) {

            // Search for entry in the cache
            for (var i = 0; i < self.cachedData.length; ++i) {
                var cachedData = self.cachedData[i];
                if (cachedData.cellId == cellId
                    && cachedData.verticalAxisMode == verticalAxisMode
                    && cachedData.searchRadius == searchRadius
                    && cachedData.useMesh == useMesh) {
                    return cachedData.data;
                }
            }

            // Couldn't find entry. Compute values.
            var locations = volumeCells.getCellLocations(cellId);
            var cellData = [];

            locations.forEach(function (location) {

                var result = {
                    usedMesh: false,
                    z: location.position.z
                };

                if (verticalAxisMode !== self.VerticalAxisModes.DEPTH) {
                    result = volumeLayers.convertPoint(location.position, verticalAxisMode, useMesh, searchRadius);
                }
                cellData.push({
                    value: result.z,
                    location: location,
                    usedMesh: result.usedMesh
                });
            });

            self.cachedData.push({
                cellId: cellId,
                verticalAxisMode: verticalAxisMode,
                searchRadius: searchRadius,
                useMesh: useMesh,
                data: cellData
            });

            return cellData;
        }

    }
})();


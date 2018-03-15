describe('iplChartData service test', function () {

    'use strict';

    var iplChartData;
    var httpBackend;
    var volumeCells;
    var volumeLayers;

    beforeEach(function () {
        module('app.iplChartModule');
        module('app.volumeModule');
    });

    beforeEach(inject(function (_iplChartData_, _volumeCells_, _volumeLayers_, $httpBackend) {
        iplChartData = _iplChartData_;
        volumeCells = _volumeCells_;
        volumeLayers = _volumeLayers_;
        httpBackend = $httpBackend;

        TestUtils.setup(httpBackend);
        TestUtils.setupLayers(httpBackend);

        volumeCells.loadCellId(6115);
        httpBackend.flush();

        volumeCells.loadCellLocationsAt(0);
        httpBackend.flush();

        volumeLayers.activate();
        httpBackend.flush();
    }));

    it('getIplChartData', function () {
        var cellIndexes = [0];
        var data = iplChartData.getIplChartData(cellIndexes, iplChartData.VerticalAxisModes.PERCENT_DIFFERENCE, false, 15000);

        // expectedValues[i] is the linearly interpolated ipl percent computer for cell 6115's fake location i.
        var expectedValues = [-0.365, -0.369, -0.368, -0.361];

        data[0].forEach(function (d, i) {
            expect(expectedValues[i]).toBeCloseTo(d.value);
        });

        // expectValue[i] is the depth value of the corresponding location
        data = iplChartData.getIplChartData(cellIndexes, iplChartData.VerticalAxisModes.DEPTH);
        expectedValues = [1, 2, 3, 4];
        data[0].forEach(function (d, i) {
            expect(d.value - expectedValues[i]).toBeCloseTo(0);
        });
    });

    it('getIplRange - ipl', function () {
        var cellIndexes = [0];
        var data = iplChartData.getIplChartData(cellIndexes, iplChartData.VerticalAxisModes.PERCENT_DIFFERENCE, false, 50000);
        var range = iplChartData.getIplRange(data);
        expect(range[0] + 0.369).toBeCloseTo(0);
        expect(range[1] + 0.361).toBeCloseTo(0);
    });

    it('getIplRange - depth', function () {
        var cellIndexes = [0];
        var data = iplChartData.getIplChartData(cellIndexes, iplChartData.VerticalAxisModes.DEPTH);
        var range = iplChartData.getIplRange(data);
        expect(range[0] - 1).toBeCloseTo(0, 0.01);
        expect(range[1] - 4).toBeCloseTo(0, 0.01);
    });

    it('getHistogramBins', function () {
        var cellIndexes = [0];
        var data = iplChartData.getIplChartData(cellIndexes, iplChartData.VerticalAxisModes.PERCENT_DIFFERENCE);
        var range = iplChartData.getIplRange(data);
        var domain = [-0.4, -0.2];
        var numBins = 5;
        var bins = iplChartData.getHistogramBins(data[0], numBins, domain, range);

        expect(bins.length == numBins).toBeTruthy();
        expect(bins[0].length == 2).toBeTruthy();
        expect(bins[1].length == 2).toBeTruthy();
        expect(bins[2].length == 0).toBeTruthy();
        expect(bins[3].length == 0).toBeTruthy();
        expect(bins[4].length == 0).toBeTruthy();
    });

    it('getHistogramMaxItemsInBins', function () {
        var cellIndexes = [0];
        var data = iplChartData.getIplChartData(cellIndexes, iplChartData.VerticalAxisModes.PERCENT_DIFFERENCE);
        var range = [0, 0]; // is not used
        var domain = [-0.4, -0.2];
        var numBins = 5;
        var maxItemsInBins = iplChartData.getHistogramMaxItemsInBins(data, numBins, domain, range);

        expect(maxItemsInBins == 2).toBeTruthy();
    });

    it('getAsCsv', function () {
        var cellIndexes = [0];
        var data = iplChartData.getIplChartData(cellIndexes, iplChartData.VerticalAxisModes.DEPTH);
        var csv = iplChartData.getAsCsv(cellIndexes, data);
        expect(csv == 'cell id, location id, z, converted value\n6115, 88637, 1, 1\n6115, 88638, 2, 2\n6115, 88639, 3, 3\n6115, 88640, 4, 4').toBeTruthy();
    });
});
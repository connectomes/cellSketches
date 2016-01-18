fdescribe('iplChartData service test', function () {

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
        var data = iplChartData.getIplChartData(cellIndexes);

        // expectedValues[i] is the linearly interpolated ipl percent computer for cell 6115's fake location i.
        var expectedValues = [-0.574468085106383, -0.5659574468085107, -0.5659574468085107, -0.5617021276595745];

        data[0].forEach(function (d, i) {
            expect(d.result.percent - expectedValues[i]).toBeCloseTo(0, 0.01);
        });
    });

    it('getIplRange', function() {
        var cellIndexes = [0];
        var data = iplChartData.getIplChartData(cellIndexes);
        var range = iplChartData.getIplRange(data);
        expect(range[0] + 0.5617021276595745).toBeCloseTo(0, 0.01);
        expect(range[1] + 0.574468085106383).toBeCloseTo(0, 0.01);
    });

    it('getHistogramBins', function() {
        var cellIndexes = [0];
        var data = iplChartData.getIplChartData(cellIndexes);
        var range = [-0.6, -0.5];
        var domain = [0, 1];
        var numBins = 5;
        var bins = iplChartData.getHistogramBins(data[0], numBins, domain, range);

        expect(bins.length == numBins).toBeTruthy();
        expect(bins[0].length == 4).toBeTruthy();
        expect(bins[1].length == 0).toBeTruthy();
        expect(bins[2].length == 0).toBeTruthy();
        expect(bins[3].length == 0).toBeTruthy();
        expect(bins[4].length == 0).toBeTruthy();
    });

    it('getHistogramMaxItemsInBins', function() {

        var cellIndexes = [0];
        var data = iplChartData.getIplChartData(cellIndexes);
        var range = [-0.6, -0.5];
        var domain = [0, 1];
        var numBins = 5;
        var maxItemsInBins = iplChartData.getHistogramMaxItemsInBins(data, numBins, domain, range);

        expect(maxItemsInBins == 4).toBeTruthy();
    });
});
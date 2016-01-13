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

    it('Convert cell locations', function () {
        var cellIndexes = [0];
        var data = iplChartData.getIplChartData(cellIndexes);

        // expectedValues[i] is the linearly interpolated ipl percent computer for cell 6115's fake location i.
        var expectedValues = [-0.574468085106383, -0.5659574468085107, -0.5659574468085107, -0.5617021276595745];

        data.forEach(function (d, i) {
            expect(d.result.percent - expectedValues[i]).toBeCloseTo(0, 0.01);
        });
    });
});
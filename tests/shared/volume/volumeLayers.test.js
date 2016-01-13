fdescribe('VolumeLayers service test', function () {

    var volumeCells, httpBackend, volumeLayers;

    // Testing setup
    beforeEach(function () {
        module('app.volumeModule');
    });

    beforeEach(inject(function (_volumeCells_, _volumeLayers_, $httpBackend) {
        volumeCells = _volumeCells_;
        volumeLayers = _volumeLayers_;
        httpBackend = $httpBackend;

        TestUtils.setup(httpBackend);
        TestUtils.setupLayers(httpBackend);
    }));

    afterEach(function () {
        httpBackend.verifyNoOutstandingRequest();
    });

    // Load upper and lower bounds. There is one of each in the fake responses.
    it('activate', function () {
        volumeLayers.activate();
        httpBackend.flush();

        expect(volumeLayers.getUpperBounds().length == 1).toBeTruthy();
        expect(volumeLayers.getLowerBounds().length == 1).toBeTruthy();
    });

    it('convert to ipl percent', function() {
        volumeLayers.activate();
        httpBackend.flush();

        var point = [97482.5, 28709.78, 136];
        var result = volumeLayers.convertToIPLPercent(point);
        expect(result.percent).toBeCloseTo(0, 0.01);

        point = [97482.5, 28709.78, 253.5];
        result = volumeLayers.convertToIPLPercent(point);
        expect(result.percent - 0.5).toBeCloseTo(0.0, 0.01);

        point = [97482.5, 28709.78, 371];
        result = volumeLayers.convertToIPLPercent(point);
        expect(result.percent - 1.0).toBeCloseTo(0.0, 0.01);
    });


});
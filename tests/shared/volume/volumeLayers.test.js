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

    // Load upper and lower bounds.
    it('activate', function () {
        volumeLayers.activate();
        httpBackend.flush();

        expect(volumeLayers.getUpperBounds().length == 4).toBeTruthy();
        expect(volumeLayers.getLowerBounds().length == 4).toBeTruthy();

        var mesh = volumeLayers.getUpperBoundsMesh();
        expect(mesh.geometry.faces.length == 2).toBeTruthy();

        mesh = volumeLayers.getLowerBoundsMesh();
        expect(mesh.geometry.faces.length == 2).toBeTruthy();
    });

    //
    it('activate', function () {
        volumeLayers.activate();
        httpBackend.flush();

        var mesh = volumeLayers.getUpperBoundsMesh();
        expect(mesh.geometry.faces.length == 2).toBeTruthy();

        var point = new utils.Point3D(0, 0, 0);


        point = new utils.Point3D(0, 0, 200);

        var conversion = volumeLayers.convertToIPLPercent(point);

        console.log(volumeLayers.convertPoint(point, volumeLayers.ConversionModes.NORMALIZED_DEPTH, false, 15000));
        console.log(volumeLayers.convertPoint(point, volumeLayers.ConversionModes.NORMALIZED_DEPTH, true));

        console.log(volumeLayers.convertPoint(point, volumeLayers.ConversionModes.PERCENT_DIFFERENCE, false, 15000));
        console.log(volumeLayers.convertPoint(point, volumeLayers.ConversionModes.PERCENT_DIFFERENCE, true));

    });


    it('convert to ipl percent', function () {
        volumeLayers.activate();
        httpBackend.flush();
    });

});
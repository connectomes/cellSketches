describe('VolumeStructures service test', function () {

    var volumeCells, httpBackend;
    var childQuery = 'http://webdev.connectomes.utah.edu/RC1Test/OData/Structures?$filter=(ParentID eq 6117)&$expand=Locations($select=Radius,VolumeX,VolumeY,Z,ParentID,ID)';
    var structureQuery = 'http://webdev.connectomes.utah.edu/RC1Test/OData/Structures?$filter=(ID eq 6117)&$expand=Locations($select=Radius,VolumeX,VolumeY,Z,ParentID,ID)';

    beforeEach(function () {
        module('app.volumeModule');
    });

    beforeEach(inject(function (_volumeCells_, $httpBackend) {
        volumeCells = _volumeCells_;
        httpBackend = $httpBackend;

        httpBackend.when('GET', structureQuery).respond(
            readJSON('tests/mock/cell6117Locations.json')
        );

        httpBackend.when('GET', childQuery).respond(
            readJSON('tests/mock/cell6117Children.json'));

    }));

    afterEach(function () {
        httpBackend.verifyNoOutstandingExpectation();
        httpBackend.verifyNoOutstandingRequest();
        httpBackend.resetExpectations();
    });

    it('Load cell locations', function () {

        var id = 6117;

        volumeCells.loadCellId(id);

        httpBackend.flush();

        expect(volumeCells.getLoadedCellIds().length == 1).toBeTruthy();

        expect(volumeCells.getCellLocations(id).length == 1882).toBeTruthy();

    });

    it('Load cell children', function () {

        var id = 6117;

        volumeCells.loadCellId(id);

        httpBackend.flush();

        expect(volumeCells.getNumCellChildren(id) == 506).toBeTruthy();

    });


});
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

    it('Load cell locations and children', function () {

        var id = 6117;

        volumeCells.loadCellId(id);

        httpBackend.flush();

        expect(volumeCells.getLoadedCellIds().length == 1).toBeTruthy();

        expect(volumeCells.getCellLocations(id).length == 1882).toBeTruthy();

        expect(volumeCells.getNumCellChildren(id) == 506).toBeTruthy();
    });

    it('Get cell children by type', function() {

        var id = 6117;

        volumeCells.loadCellId(id);

        httpBackend.flush();

        // Get children of type '28'
        var childrenIndexes = volumeCells.getCellChildTypeIndexes(0, 28);

        expect(childrenIndexes.length == 30).toBeTruthy();

        // 1 is an invalid child type. expect nothing in return.
        childrenIndexes = volumeCells.getCellChildTypeIndexes(0, 1);

        expect(childrenIndexes.length == 0).toBeTruthy();
    });

    it('Get cell children partners', function() {

    });
});
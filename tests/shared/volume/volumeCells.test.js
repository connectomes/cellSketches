describe('VolumeStructures service test', function () {

    var volumeCells, httpBackend;
    var childQuery = 'http://websvc1.connectomes.utah.edu/RC1/OData/Structures?$filter=(ParentID eq 6117)&$expand=Locations($select=Radius,VolumeX,VolumeY,Z,ParentID,ID)';
    var structureQuery = 'http://websvc1.connectomes.utah.edu/RC1/OData/Structures?$filter=(ID eq 6117)';
    var loadLocalQuery = '../tests/mock/volumeCells.startsWithCBb4w.json';


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


        httpBackend.when('GET', loadLocalQuery).respond(
            readJSON('tests/mock/volumeCells.startsWithCBb4w.json'));
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
    });

    it('Get cell children by type', function() {

        var id = 6117;

        volumeCells.loadCellId(id);

        httpBackend.flush();

        volumeCells.loadCellChildrenAt(0);

        httpBackend.flush();

        var childrenIndexes = volumeCells.getCellChildrenByTypeIndexes(0, 28);

        // 30 is count of children with TypeID == 28.
        expect(childrenIndexes.length == 30).toBeTruthy();

        childrenIndexes = volumeCells.getCellChildrenByTypeIndexes(0, 1);

        // There should be no children of 6117 with TypeID == 1.
        expect(childrenIndexes.length == 0).toBeTruthy();
    });

    it('Load local starts with and get children', function() {

        volumeCells.loadFromFile(loadLocalQuery);

        httpBackend.flush();

        console.log(volumeCells);

    });

});
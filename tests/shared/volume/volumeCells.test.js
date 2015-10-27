describe('VolumeStructures service test', function () {

    var volumeCells, httpBackend;
    var structureQuery = 'http://websvc1.connectomes.utah.edu/RC1/OData/Structures?$filter=(ID eq 6117)';
    var loadLocalQuery = '../tests/mock/volumeCells.startsWithCBb4w.json';
    var invalidCellQuery = 'http://websvc1.connectomes.utah.edu/RC1/OData/Structures?$filter=(ID eq 6117 or ID eq -1)';

    var loadCell6115 = 'http://websvc1.connectomes.utah.edu/RC1/OData/Structures?$filter=(ID eq 6115)';
    var loadCell6115Children = 'http://websvc1.connectomes.utah.edu/RC1/OData/Structures?$filter=(ParentID eq 6115)&$expand=Locations($select=Radius,VolumeX,VolumeY,Z,ParentID,ID)';
    var loadCell6115ChildrenEdges = 'http://websvc1.connectomes.utah.edu/RC1/OData/Structures(6115)/Children?$expand=SourceOfLinks($expand=Target($select=ParentID)),TargetOfLinks($expand=Source($select=ParentID))';
    var loadCell6115Neighbors = 'http://websvc1.connectomes.utah.edu/RC1/OData/Structures?$filter=(ID eq 69493 or ID eq 86246 or ID eq 69496 or ID eq 69503 or ID eq 69500 or ID eq 72451 or ID eq 32970 or ID eq 8577 or ID eq 16087 or ID eq 66696)';
    beforeEach(function () {
        module('app.volumeModule');
    });

    beforeEach(inject(function (_volumeCells_, $httpBackend) {
        volumeCells = _volumeCells_;
        httpBackend = $httpBackend;

        httpBackend.when('GET', structureQuery).respond(
            readJSON('tests/mock/cell6117.json')
        );

        httpBackend.when('GET', loadLocalQuery).respond(
            readJSON('tests/mock/volumeCells.startsWithCBb4w.json'));

        httpBackend.when('GET', invalidCellQuery).respond(
            readJSON('tests/mock/cell6117.json'));

        httpBackend.when('GET', loadCell6115).respond(
            readJSON('tests/mock/childrenStitching/6115.json'));

        httpBackend.when('GET', loadCell6115Children).respond(
            readJSON('tests/mock/childrenStitching/6115Children.json'));

        httpBackend.when('GET', loadCell6115ChildrenEdges).respond(
            readJSON('tests/mock/childrenStitching/6115ChildrenEdges.json'));

        httpBackend.when('GET', loadCell6115Neighbors).respond(
            readJSON('tests/mock/childrenStitching/6115Neighbors.json'));
    }));

    afterEach(function () {
        httpBackend.verifyNoOutstandingExpectation();
        httpBackend.verifyNoOutstandingRequest();
        httpBackend.resetExpectations();
    });

    it('Load cell', function () {

        var id = 6117;

        volumeCells.loadCellId(id);

        httpBackend.flush();

        expect(volumeCells.getLoadedCellIds().length == 1).toBeTruthy();
    });

    it('Load invalid cell id', function() {

        var ids = [6117, -1];

        volumeCells.loadCellIds(ids).then(success, failure);

        httpBackend.flush();

        function failure(results) {
            expect(results.invalidIds[0] == -1).toBeTruthy();
        }

        function success() {
            expect(false).toBeTruthy();
        }

    });

    it('Get cell children by type', function() {

        var id = 6115;

        volumeCells.loadCellId(id);
        httpBackend.flush();

        expect(volumeCells.getLoadedCellIds()[0] == 6115).toBeTruthy();

        volumeCells.loadCellChildrenAt(0);
        httpBackend.flush();

        expect(volumeCells.getNumCellChildrenAt(0) == 10).toBeTruthy();
        expect(volumeCells.getCellChildrenByTypeIndexes(0, 73).length == 3).toBeTruthy();
        expect(volumeCells.getCellChildrenByTypeIndexes(0, 35).length == 6).toBeTruthy();
        expect(volumeCells.getCellChildrenByTypeIndexes(0, 28).length == 1).toBeTruthy();

        volumeCells.loadCellChildrenEdgesAt(0);
        httpBackend.flush();
    });

    it('Load cell children edges', function() {

        var id = 6115;

        volumeCells.loadCellId(id);
        httpBackend.flush();

        volumeCells.loadCellChildrenAt(0);
        httpBackend.flush();

        volumeCells.loadCellChildrenEdgesAt(0);
        httpBackend.flush();

        var expectedNeighborIds = [69493, 86246, 69493, 69496, 69503, 69500, 72451, 32970, 8577, 16087, 66696, 6115];
        var neighborIds = volumeCells.getCellNeighborIdsAt(0);

        // Check connections of first child.
        expect(volumeCells.getCellChildPartnerAt(0, 0).parentId[0] == 69493).toBeTruthy();
        expect(volumeCells.getCellChildPartnerAt(0, 0).parentId[1] == 86246).toBeTruthy();
        expect(volumeCells.getCellChildPartnerAt(0, 0).bidirectional[0] == false).toBeTruthy();
        expect(volumeCells.getCellChildPartnerAt(0, 0).bidirectional[1] == false).toBeTruthy();
        expect(volumeCells.getCellChildPartnerAt(0, 0).partnerIndex[0] == 69495).toBeTruthy();
        expect(volumeCells.getCellChildPartnerAt(0, 0).partnerIndex[1] == 86247).toBeTruthy();

        // Check connections of second child.
        expect(volumeCells.getCellChildPartnerAt(0, 1).parentId[0] == 69493).toBeTruthy();
        expect(volumeCells.getCellChildPartnerAt(0, 1).partnerIndex[0] == 69494).toBeTruthy();
        expect(volumeCells.getCellChildPartnerAt(0, 1).bidirectional[0] == false).toBeTruthy();
    });

    it('Get cell neighbors', function() {

        var id = 6115;

        volumeCells.loadCellId(id);
        httpBackend.flush();

        volumeCells.loadCellChildrenAt(0);
        httpBackend.flush();

        volumeCells.loadCellChildrenEdgesAt(0);
        httpBackend.flush();

        var expectedNeighborIds = [69493, 86246, 69493, 69496, 69503, 69500, 72451, 32970, 8577, 16087, 66696, 6115];
        var neighborIds = volumeCells.getCellNeighborIdsAt(0);

        for(var i=0; i<expectedNeighborIds.length; ++i) {
            expect(neighborIds.indexOf(expectedNeighborIds[i]) != -1).toBeTruthy();
        }

    });

    it('Has loaded neighbors', function() {

        var id = 6115;

        volumeCells.loadCellId(id);
        httpBackend.flush();

        volumeCells.loadCellChildrenAt(0);
        httpBackend.flush();

        volumeCells.loadCellChildrenEdgesAt(0);
        httpBackend.flush();

        expect(volumeCells.hasLoadedNeighbors(0) == false).toBeTruthy();

        volumeCells.loadCellNeighborsAt(0);
        httpBackend.flush();

        expect(volumeCells.hasLoadedNeighbors(0)).toBeTruthy();
    });

});
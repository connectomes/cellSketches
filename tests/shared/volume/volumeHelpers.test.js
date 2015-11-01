describe('VolumeHelpers service test', function () {

    var volumeCells, volumeStructures, volumeHelpers, httpBackend;

    // Testing setup
    beforeEach(function () {
        module('app.volumeModule');
    });

    beforeEach(inject(function (_volumeHelpers_, _volumeCells_, _volumeStructures_, $httpBackend) {
        volumeCells = _volumeCells_;
        volumeStructures = _volumeStructures_;
        volumeHelpers = _volumeHelpers_;
        httpBackend = $httpBackend;

        TestUtils.setup(httpBackend);
    }));

    it('getPerChildTargetNames without groups', function () {

        var id = 6115;
        TestUtils.loadCellAndNeighbors(id, volumeCells, volumeStructures, httpBackend);

        // The neighbors of cell 6115 have the following labels: YAC Starburst, GC, AC, null, CBb5w
        var cellIndexes = [0];
        var childType = undefined;
        var useTargetLabelGroups = false;
        var targets = volumeHelpers.getPerChildTargetNames(cellIndexes, childType, useTargetLabelGroups);

        expect(targets.length == 5).toBeTruthy();

        // Check that we found all the targets!
        var actualTargets = ['YAC Starburst', 'GC', 'AC', 'null', 'CBb5w'];
        for (var i = 0; i < actualTargets.length; ++i) {
            expect(targets.indexOf(actualTargets[i]) != -1).toBeTruthy();
        }
    });

    it('getPerChildTargetNames with groups', function () {

        var id = 6115;
        TestUtils.loadCellAndNeighbors(id, volumeCells, volumeStructures, httpBackend);

        var cellIndexes = [0];
        var childType = undefined;
        var useTargetLabelGroups = true;
        var targets = volumeHelpers.getPerChildTargetNames(cellIndexes, childType, useTargetLabelGroups);

        // List of target groups from looking at cell 6115's neighbors.
        var expectedTargets = ['null', 'CBb', 'YAC', 'GC', 'In Class', 'Self'];

        targets.forEach(function (e, i) {
            expect(e == expectedTargets[i]).toBeTruthy();
        });

    });

    it('getPerChildTargetAttributes', function() {

    });
});
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

    it('get and setCurrentUnits', function() {

        expect(volumeHelpers.getCurrentUnits() == 'nm').toBeTruthy();

        volumeHelpers.setCurrentUnits('px');
        expect(!volumeHelpers.isUnitConversionNeeded()).toBeTruthy();

        expect(volumeHelpers.getCurrentUnits() == 'px').toBeTruthy();

        volumeHelpers.setCurrentUnits('nm');

        expect(volumeHelpers.isUnitConversionNeeded()).toBeTruthy();

        expect(volumeHelpers.getCurrentUnits() == 'nm').toBeTruthy();

    });

    it('get and setUseTargetLabelGroups', function() {

        expect(volumeHelpers.isUsingTargetLabelGroups()).toBeTruthy();

        volumeHelpers.setUseTargetLabelGroups(false);
        expect(!volumeHelpers.isUsingTargetLabelGroups()).toBeTruthy();

        volumeHelpers.setUseTargetLabelGroups(true);
        expect(volumeHelpers.isUsingTargetLabelGroups()).toBeTruthy();
    });

    it('getPerChildTargetNames without groups', function() {

        var id = 6115;
        TestUtils.loadCellAndNeighbors(id, volumeCells, volumeStructures, httpBackend);

        volumeHelpers.setUseTargetLabelGroups(false);

        // The neighbors of cell 6115 have the following labels: YAC Starburst, GC, AC, null, CBb5w
        var cellIndexes = [0];
        var targets = volumeHelpers.getPerChildTargetNames(cellIndexes);

        expect(targets.length == 5).toBeTruthy();

        // Check that we found all the targets!
        var actualTargets = ['YAC Starburst', 'GC', 'AC', 'null', 'CBb5w'];
        for(var i=0; i<actualTargets.length; ++i) {
            expect(targets.indexOf(actualTargets[i]) != -1).toBeTruthy();
        }
    });
});
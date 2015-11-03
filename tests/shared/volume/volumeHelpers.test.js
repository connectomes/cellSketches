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

        // The only group adjacent to cell 6115 by gap junction is 'Self'
        var cellIndexes = [0];
        var useTargetLabelGroups = true;
        var childType = 28;

        var targets = volumeHelpers.getPerChildTargetNames(cellIndexes, childType, useTargetLabelGroups);
        expect(targets.length == 1).toBeTruthy();
        expect(targets[0] == 'Self');

        // List of target groups from all child types.
        childType = undefined;
        targets = volumeHelpers.getPerChildTargetNames(cellIndexes, childType, useTargetLabelGroups);

        var expectedTargets = ['null', 'YAC', 'GC', 'In Class', 'Self'];
        expect(targets.length == 5).toBeTruthy();
        targets.forEach(function (e, i) {
            expect(expectedTargets.indexOf(e) != -1).toBeTruthy();
        });
    });

    it('getChildAttribute', function () {

        var id = 6115;
        TestUtils.loadCellAndNeighbors(id, volumeCells, volumeStructures, httpBackend);

        var units = volumeHelpers.Units.PIXELS;
        var attribute = volumeHelpers.PerChildAttributes.DIAMETER;
        var value = volumeHelpers.getChildAttr(0, 0, attribute, units);

        // Diameter of cell 0, child 0 in pixels.
        expect(value - 125.103611).toBeCloseTo(0);

        units = volumeHelpers.Units.NM;
        value = volumeHelpers.getChildAttr(0, 0, attribute, units);

        // Diameter of cell 0, child 0 in n.
        expect(value - 272.7258736).toBeCloseTo(0);

        attribute = volumeHelpers.PerChildAttributes.DISTANCE;
        units = volumeHelpers.Units.PIXELS;
        value = volumeHelpers.getChildAttr(0, 0, attribute, units);

        // Distance from cell's centroid at (5,5) to cell's child centroid at (23.33, 26.66)
        expect(value - 28.3823).toBeCloseTo(0);

        units = volumeHelpers.Units.NM;
        value = volumeHelpers.getChildAttr(0, 0, attribute, units);
        expect(value - (28.3823 * utils.nmPerPixel)).toBeCloseTo(0);
    });

    it('getPerChildTargetAttributes groups - simple', function () {

        var id = 6115;
        TestUtils.loadCellAndNeighbors(id, volumeCells, volumeStructures, httpBackend);

        var cellIndexes = [0];
        var childType = 28;
        var useTargetLabelGroups = true;
        var attribute = volumeHelpers.PerChildAttributes.DIAMETER;
        var units = volumeHelpers.Units.PIXELS;
        var results = volumeHelpers.getPerChildAttrGroupedByTarget(cellIndexes, childType, useTargetLabelGroups, attribute, units);

        // There is only one child type 28. Its diameter is 70.
        expect(results.minValue - 70.00).toBeCloseTo(0);
        expect(results.maxValue - 70.00).toBeCloseTo(0);
        expect(results.valuesLists.length == 1).toBeTruthy();
        expect(results.valuesLists[0].length == 1).toBeTruthy();
        expect(results.labels.length == 1).toBeTruthy();
        expect(results.labels[0] == 'Self').toBeTruthy();

        var childId = volumeCells.getCellChildAt(0, results.valuesLists[0][0].childIndex).id;
        expect(childId == 16063).toBeTruthy();

        // Parent of this child must be 6115.
        expect(results.valuesLists[0][0].parentIndex == 0).toBeTruthy();

        // The target of this child is the 0th partner.
        expect(results.valuesLists[0][0].partnerIndex == 0).toBeTruthy();
    });

    it('getPerChildTargetAttributes groups - advanced', function () {

        var id = 6115;
        TestUtils.loadCellAndNeighbors(id, volumeCells, volumeStructures, httpBackend);

        var cellIndexes = [0];
        var childType = undefined;
        var useTargetLabelGroups = true;
        var attribute = volumeHelpers.PerChildAttributes.DIAMETER;
        var units = volumeHelpers.Units.PIXELS;
        var results = volumeHelpers.getPerChildAttrGroupedByTarget(cellIndexes, childType, useTargetLabelGroups, attribute, units);

        expect(results.labels.length == 5).toBeTruthy();

        // Smallest diameter is 70, largest is 303.267.
        expect(results.minValue - 70.00).toBeCloseTo(0);
        expect(results.maxValue - 303.267).toBeCloseTo(0);

        var valuesLists = results.valuesLists;
        var targetGroups = results.labels;

        // For each target group, check that each partner that is supposed to be in the group is actually in the group.
        targetGroups.forEach(function (targetGroup, i) {

            var valuesList = valuesLists[i];

            valuesList.forEach(function (values) {

                var childPartners = volumeCells.getCellChildPartnerAt(values.parentIndex, values.childIndex);
                var neighborId = childPartners.neighborIds[values.partnerIndex];
                var neighborIndex = volumeCells.getCellIndex(neighborId);
                var neighborLabel = volumeCells.getCellAt(neighborIndex).label;
                var neighborGroupIndex = volumeStructures.getGroupOfLabel(neighborLabel);

                if (targetGroup == volumeStructures.getGroupNameInClass()) {
                    // If the group is 'In Class' then all partners must have type CBb5w and not be equal to the source.
                    expect(neighborLabel == 'CBb5w').toBeTruthy();
                    expect(neighborIndex != 0).toBeTruthy();
                } else if (targetGroup == volumeStructures.getGroupNameSelf()) {
                    // Self group should be connected to cell 6115.
                    expect(neighborIndex == 0).toBeTruthy();
                } else {
                    // Check that neighbor's label is in the right group.
                    expect(volumeStructures.getGroupAt(neighborGroupIndex) == results.labels[i]).toBeTruthy();
                }
            });
        });
    });

    it('getPerChildTargetAttribute no groups - simple', function() {

        var id = 6115;
        TestUtils.loadCellAndNeighbors(id, volumeCells, volumeStructures, httpBackend);

        var cellIndexes = [0];
        var childType = 28;
        var useTargetLabelGroups = false;
        var attribute = volumeHelpers.PerChildAttributes.DIAMETER;
        var units = volumeHelpers.Units.PIXELS;
        var results = volumeHelpers.getPerChildAttrGroupedByTarget(cellIndexes, childType, useTargetLabelGroups, attribute, units);

        // There is only one child type 28. Its diameter is 70.
        expect(results.minValue - 70.00).toBeCloseTo(0);
        expect(results.maxValue - 70.00).toBeCloseTo(0);
        expect(results.valuesLists.length == 1).toBeTruthy();
        expect(results.valuesLists.length == 1).toBeTruthy();
        expect(results.valuesLists[0].length == 1).toBeTruthy();
        expect(results.labels.length == 1).toBeTruthy();
        expect(results.labels[0] == 'CBb5w').toBeTruthy();

    });

    it('getPerChildTargetAttribute no groups - advanced', function() {

        var id = 6115;
        TestUtils.loadCellAndNeighbors(id, volumeCells, volumeStructures, httpBackend);

        var cellIndexes = [0];
        var childType = undefined;
        var useTargetLabelGroups = false;
        var attribute = volumeHelpers.PerChildAttributes.DIAMETER;
        var units = volumeHelpers.Units.PIXELS;
        var results = volumeHelpers.getPerChildAttrGroupedByTarget(cellIndexes, childType, useTargetLabelGroups, attribute, units);

        // Smallest diameter is 70, largest is 303.267.
        expect(results.minValue - 70.00).toBeCloseTo(0);
        expect(results.maxValue - 303.267).toBeCloseTo(0);

        results.valuesLists.forEach(function(valuesList, i) {

            valuesList.forEach(function (values) {

                var childPartners = volumeCells.getCellChildPartnerAt(values.parentIndex, values.childIndex);
                var neighborId = childPartners.neighborIds[values.partnerIndex];
                var neighborIndex = volumeCells.getCellIndex(neighborId);
                var neighborLabel = volumeCells.getCellAt(neighborIndex).label;

                expect(neighborLabel == results.labels[i]).toBeTruthy();
            });

        });

    });
});
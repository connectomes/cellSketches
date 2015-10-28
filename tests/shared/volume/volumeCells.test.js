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

    beforeEach(inject(function (_volumeCells_, _volumeStructures_, $httpBackend) {
        volumeCells = _volumeCells_;
        volumeStructures = _volumeStructures_;
        httpBackend = $httpBackend;

        // Prepare for volumeStructure queries.
        httpBackend.when('GET', structureQuery).respond(
            readJSON('tests/mock/cell6117.json')
        );

        httpBackend.when('GET', 'http://websvc1.connectomes.utah.edu/RC1/OData/StructureTypes').respond(
            readJSON('tests/mock/childrenStitching/childStructureTypes.json')
        );

        // Prepare for volumeCells queries.
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

        httpBackend.when('GET', '../shared/volume/labelGroups.json').respond(
            readJSON('shared/volume/labelGroups.json')
        );
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

    it('Load invalid cell id', function () {

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

    it('Get cell children by type', function () {

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
        expect(volumeCells.getCellChildrenByTypeIndexes(0).length == 10).toBeTruthy();

        volumeCells.loadCellChildrenEdgesAt(0);
        httpBackend.flush();
    });

    it('Load cell children edges', function () {

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

    it('getCellNeighbors', function () {

        var id = 6115;

        volumeCells.loadCellId(id);
        httpBackend.flush();

        volumeCells.loadCellChildrenAt(0);
        httpBackend.flush();

        volumeCells.loadCellChildrenEdgesAt(0);
        httpBackend.flush();

        var expectedNeighborIds = [69493, 86246, 69493, 69496, 69503, 69500, 72451, 32970, 8577, 16087, 66696, 6115];
        var neighborIds = volumeCells.getCellNeighborIdsAt(0);

        for (var i = 0; i < expectedNeighborIds.length; ++i) {
            expect(neighborIds.indexOf(expectedNeighborIds[i]) != -1).toBeTruthy();
        }

    });

    it('hasLoadedNeighbors', function () {

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

    it('getCellIndexesInGroup', function () {

        var id = 6115;

        volumeStructures.activateCellLabelGroups();
        httpBackend.flush();

        volumeCells.loadCellId(id);
        httpBackend.flush();

        volumeCells.loadCellChildrenAt(0);
        httpBackend.flush();

        volumeCells.loadCellChildrenEdgesAt(0);
        httpBackend.flush();

        volumeCells.loadCellNeighborsAt(0);
        httpBackend.flush();

        var cellIndex = volumeCells.getCellIndex(id);

        // For each possible target group...
        for (var i = 0; i < volumeStructures.getNumGroups(); ++i) {

            // Get the cell indexes present in that group.
            var indexes = volumeCells.getCellIndexesInGroup(i, cellIndex);

            var labels = [];

            if (i == volumeStructures.getGroupIndexInClass()) {

                // If the group is in class, then we expect all cells to have the same label as the input cell.
                labels = [volumeCells.getCellAt(cellIndex).label];

            } else if (i == volumeStructures.getGroupIndexSelf()) {

                // If the group is self, then we expect there should only be one cell index returned.
                expect(indexes.length == 1).toBeTruthy();
                expect(indexes[0] == volumeCells.getCellIndex(id)).toBeTruthy();

                continue;

            } else {

                // Otherwise use labels as normal.
                labels = volumeStructures.getLabelsInGroup(i);

            }

            var returnedLabels = [];

            // Check that all of the returned cell indexes have labels in the correct group.
            for (var j = 0; j < indexes.length; ++j) {
                var currLabel = volumeCells.getCellAt(indexes[j]).label;
                expect(labels.indexOf(currLabel) != -1).toBeTruthy();
                returnedLabels.push(currLabel);
            }

            // Check that the group of our target cell EXCLUDES its in-class label.
            if (volumeStructures.getGroupAt(i) == 'CBb') {
                expect(returnedLabels.indexOf('CBb5w') == -1);
            }
        }
    });

    it('getCellChildrenConnectedToIndexes', function () {

        var id = 6115;

        volumeStructures.activateCellLabelGroups();
        httpBackend.flush();

        volumeCells.loadCellId(id);
        httpBackend.flush();

        volumeCells.loadCellChildrenAt(0);
        httpBackend.flush();

        volumeCells.loadCellChildrenEdgesAt(0);
        httpBackend.flush();

        volumeCells.loadCellNeighborsAt(0);
        httpBackend.flush();

        // What group does the label 'YAC Starburst' belong to?
        var targetGroup = volumeStructures.getGroupOfLabel('YAC Starburst');
        var targetLabels = volumeStructures.getLabelsInGroup(targetGroup);

        // Get list of all loaded cells in that group.
        var targetIndexes = volumeCells.getCellIndexesInGroup(targetGroup, 0);

        // Get list of all children from cell 0 connected to other cells in that group.
        var childrenConnectedToTargetGroup = volumeCells.getCellChildrenConnectedToIndexes(0, targetIndexes, undefined);

        var children = childrenConnectedToTargetGroup.indexes;
        var partnerOffsets = childrenConnectedToTargetGroup.partners;

        // Loop over the returned children. Check that they actually point to cells in the target group.
        var partner, targetCellId, targetCell;
        for (var i = 0; i < children.length; ++i) {
            partner = volumeCells.getCellChildPartnerAt(0, children[i]);
            targetCellId = partner.parentId[partnerOffsets[i]];
            targetCell = volumeCells.getCell(targetCellId);
            expect(targetLabels.indexOf(targetCell.label) != -1).toBeTruthy();
        }

        // Repeat for another group.
        targetGroup = volumeStructures.getGroupOfLabel('null');
        targetIndexes = volumeCells.getCellIndexesInGroup(targetGroup, 0);
        targetLabels = volumeStructures.getLabelsInGroup(targetGroup);

        childrenConnectedToTargetGroup = volumeCells.getCellChildrenConnectedToIndexes(0, targetIndexes, undefined);
        children = childrenConnectedToTargetGroup.indexes;
        partnerOffsets = childrenConnectedToTargetGroup.partners;

        for (i = 0; i < children.length; ++i) {
            partner = volumeCells.getCellChildPartnerAt(0, children[i]);
            targetCellId = partner.parentId[partnerOffsets[i]];
            targetCell = volumeCells.getCell(targetCellId);
            expect(targetLabels.indexOf(targetCell.label) != -1).toBeTruthy();
        }
    });

    it('get children in group by type', function () {

        var id = 6115;

        volumeStructures.activate();
        httpBackend.flush();

        volumeStructures.activateCellLabelGroups();
        httpBackend.flush();

        volumeCells.loadCellId(id);
        httpBackend.flush();

        volumeCells.loadCellChildrenAt(0);
        httpBackend.flush();

        volumeCells.loadCellChildrenEdgesAt(0);
        httpBackend.flush();

        volumeCells.loadCellNeighborsAt(0);
        httpBackend.flush();

        // For all of the child types possible...
        for (var i = 0; i < volumeStructures.getNumChildStructureTypes(); ++i) {

            var childType = volumeStructures.getChildStructureTypeAt(i);

            // For all of the label grousp...
            for (var j = 0; j < volumeStructures.getNumGroups(); ++j) {

                // Get the children connected to the current label group.
                var groupIndex = j;
                var targetLabels = volumeStructures.getLabelsInGroup(groupIndex);
                var childrenConnectedToTargetGroup = volumeCells.getCellChildrenConnectedToGroupIndex(0, groupIndex, childType);
                var children = childrenConnectedToTargetGroup.indexes;
                var partnerOffsets = childrenConnectedToTargetGroup.partners;

                // Check for sanity...
                var partner, targetCellId, targetCell, k;
                if (groupIndex == volumeStructures.getGroupIndexInClass()) {

                    // When looking at the in class group, we should only find children pointing to cells with the same
                    // label AND that are NOT the starting cell.
                    for (k = 0; k < children.length; ++k) {
                        partner = volumeCells.getCellChildPartnerAt(0, children[k]);
                        targetCellId = partner.parentId[partnerOffsets[k]];
                        targetCell = volumeCells.getCell(targetCellId);
                        expect(targetCell.label == 'CBb5w').toBeTruthy();
                        expect(targetCellId != 6115).toBeTruthy();
                    }

                } else if (groupIndex == volumeStructures.getGroupIndexSelf()) {

                    // The only children returned should point back to cell 6115.
                    for (k = 0; k < children.length; ++k) {
                        partner = volumeCells.getCellChildPartnerAt(0, children[k]);
                        targetCellId = partner.parentId[partnerOffsets[k]];
                        targetCell = volumeCells.getCell(targetCellId);
                        expect(targetCellId == id).toBeTruthy();
                    }

                } else {

                    // Children returned should be in the desired label. They should also not be in the same group
                    // nor the starting cell.
                    for (k = 0; k < children.length; ++k) {
                        partner = volumeCells.getCellChildPartnerAt(0, children[k]);
                        targetCellId = partner.parentId[partnerOffsets[k]];
                        targetCell = volumeCells.getCell(targetCellId);

                        // Check target label in correct group.
                        expect(targetLabels.indexOf(targetCell.label) != -1).toBeTruthy();

                        // Check target label not in same class. This should be caught above.
                        expect(volumeCells.getCell(id).label != targetCell.label).toBeTruthy();

                        // Check that target cell is not self. This should be caught by 'self'
                        expect(targetCellId != id).toBeTruthy();
                    }
                }
            }
        }
    });

    it('getAllAvailableChildTypes', function () {

        var id = 6115;

        volumeStructures.activate();
        httpBackend.flush();

        volumeStructures.activateCellLabelGroups();
        httpBackend.flush();

        volumeCells.loadCellId(id);
        httpBackend.flush();

        volumeCells.loadCellChildrenAt(0);
        httpBackend.flush();

        var availableChildren = volumeCells.getAllAvailableChildTypes();

        expect(availableChildren[0] == 73).toBeTruthy();
        expect(availableChildren[1] == 35).toBeTruthy();
        expect(availableChildren[2] == 28).toBeTruthy();
    });

    it('getAllAvailableGroups', function () {

        var id = 6115;

        volumeStructures.activate();
        httpBackend.flush();

        volumeStructures.activateCellLabelGroups();
        httpBackend.flush();

        volumeCells.loadCellId(id);
        httpBackend.flush();

        volumeCells.loadCellChildrenAt(0);
        httpBackend.flush();

        volumeCells.loadCellChildrenEdgesAt(0);
        httpBackend.flush();

        volumeCells.loadCellNeighborsAt(0);
        httpBackend.flush();

        var groups = volumeCells.getAllAvailableGroups();

        expect(groups[0] == 0).toBeTruthy();
        expect(groups[1] == 3).toBeTruthy();
        expect(groups[2] == 5).toBeTruthy();
        expect(groups[3] == 10).toBeTruthy();
        expect(groups[4] == 11).toBeTruthy();
        expect(groups[5] == 12).toBeTruthy();
    });

});
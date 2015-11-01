var TestUtils = (function () {
    'use strict';

    return {
        setup: setup,
        loadCellAndNeighbors: loadCellAndNeighbors
    };

    function setup(httpBackend) {
        // Requests that will be created by various tests.
        var loadCell6115Invalid = 'http://websvc1.connectomes.utah.edu/RC1/OData/Structures?$filter=(ID eq 6115 or ID eq -1)';
        var loadCell6115 = 'http://websvc1.connectomes.utah.edu/RC1/OData/Structures?$filter=(ID eq 6115)';
        var loadCell6115Locations = 'http://websvc1.connectomes.utah.edu/RC1/OData/Locations?$filter=(ParentID eq 6115)&$select=Radius,VolumeX,VolumeY,Z,ParentID,ID';
        var loadCell6115Children = 'http://websvc1.connectomes.utah.edu/RC1/OData/Structures?$filter=(ParentID eq 6115)&$expand=Locations($select=Radius,VolumeX,VolumeY,Z,ParentID,ID)';
        var loadCell6115ChildrenEdges = 'http://websvc1.connectomes.utah.edu/RC1/OData/Structures(6115)/Children?$expand=SourceOfLinks($expand=Target($select=ParentID)),TargetOfLinks($expand=Source($select=ParentID))';
        var loadCell6115Neighbors = 'http://websvc1.connectomes.utah.edu/RC1/OData/Structures?$filter=(ID eq 69493 or ID eq 86246 or ID eq 69496 or ID eq 69503 or ID eq 69500 or ID eq 72451 or ID eq 32970 or ID eq 8577 or ID eq 16087 or ID eq 66696)';
        var loadChildStructureTypes = 'http://websvc1.connectomes.utah.edu/RC1/OData/StructureTypes';

        // Fake responses for tests that use only volume cells.
        httpBackend.when('GET', loadCell6115Invalid).respond(
            readJSON('tests/mock/cell6115.json')
        );

        httpBackend.when('GET', loadCell6115).respond(
            readJSON('tests/mock/cell6115.json')
        );

        httpBackend.when('GET', loadCell6115Children).respond(
            readJSON('tests/mock/cell6115Children.json')
        );

        httpBackend.when('GET', loadCell6115ChildrenEdges).respond(
            readJSON('tests/mock/cell6115ChildrenEdges.json')
        );

        httpBackend.when('GET', loadCell6115Neighbors).respond(
            readJSON('tests/mock/cell6115Neighbors.json')
        );

        httpBackend.when('GET', loadCell6115Locations).respond(
            readJSON('tests/mock/cell6115Locations.json')
        );

        // Fake responses for tests that use volumeStructures as well as volumeCells.
        httpBackend.when('GET', loadChildStructureTypes).respond(
            readJSON('tests/mock/childStructureTypes.json')
        );

        httpBackend.when('GET', '../shared/volume/labelGroups.json').respond(
            readJSON('shared/volume/labelGroups.json')
        );

    }

    function loadCellAndNeighbors(id, volumeCells, volumeStructures, httpBackend) {

        volumeStructures.activate();
        httpBackend.flush();

        volumeCells.loadCellId(id);
        httpBackend.flush();

        volumeCells.loadCellLocationsAt(0);
        httpBackend.flush();

        volumeCells.loadCellChildrenAt(0);
        httpBackend.flush();

        volumeCells.loadCellChildrenEdgesAt(0);
        httpBackend.flush();

        volumeCells.loadCellNeighborsAt(0);
        httpBackend.flush();
    }

})();
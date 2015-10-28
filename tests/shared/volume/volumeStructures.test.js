describe('VolumeStructures service test', function () {
    var volumeStructures, httpBackend;

    beforeEach(function () {
        module('app.volumeModule');
    });

    beforeEach(inject(function (_volumeStructures_, $httpBackend) {
        volumeStructures = _volumeStructures_;
        httpBackend = $httpBackend;

        // TODO: Move this to an external json file.
        httpBackend.when('GET', 'http://websvc1.connectomes.utah.edu/RC1/OData/StructureTypes').respond(
            readJSON('tests/mock/childrenStitching/childStructureTypes.json')
        );

        httpBackend.when('GET', '../shared/volume/labelGroups.json').respond(
            readJSON('shared/volume/labelGroups.json')
        );

    }));

    it('Initializing volume structures', function () {

        // Initialize the volumeStructure service -- this will call the fake http request above.
        volumeStructures.activate();

        // Tell the fake http server to complete the request.
        httpBackend.flush();

        // We expect 32 child structures to be returned.
        expect(volumeStructures.getNumChildStructureTypes() == 32).toBeTruthy();
    });

    it('Initializing label groups', function () {

        volumeStructures.activateCellLabelGroups();
        httpBackend.flush();

        expect(volumeStructures.getNumGroups() == 13).toBeTruthy();
        expect(volumeStructures.getGroupAt(0) == 'CBb').toBeTruthy();
    });

    it('Accessing label groups', function () {

        volumeStructures.activateCellLabelGroups();
        httpBackend.flush();

        expect(volumeStructures.getGroupOfLabel('CBb4iw') == 0).toBeTruthy();
        expect(volumeStructures.getGroupOfLabel('Rod BC') == 4).toBeTruthy();

        expect(volumeStructures.getLabelsInGroup(4)[0] == 'Rod BC').toBeTruthy();

    });

    it('Accessing self and in label groups', function () {

        volumeStructures.activateCellLabelGroups();
        httpBackend.flush();

        var groupIndex = volumeStructures.getGroupIndexInClass();
        var groupName = volumeStructures.getGroupAt(groupIndex);
        expect(groupName == 'In Class').toBeTruthy();

        groupIndex = volumeStructures.getGroupIndexSelf();
        groupName = volumeStructures.getGroupAt(groupIndex);
        expect(groupName == 'Self').toBeTruthy();

    });
});
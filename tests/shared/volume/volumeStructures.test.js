describe('VolumeStructures service test', function () {
    var volumeStructures, httpBackend;

    beforeEach(function () {
        module('app.volumeModule');
    });

    beforeEach(inject(function (_volumeStructures_, $httpBackend) {

        // Create structures for testing.
        volumeStructures = _volumeStructures_;
        httpBackend = $httpBackend;

        // Setup fake server responses.
        var loadStructureTypes = 'http://websvc1.connectomes.utah.edu/RC1/OData/StructureTypes';
        var loadLabelGroups = '../shared/volume/labelGroups.json';

        httpBackend.when('GET', loadStructureTypes).respond(
            readJSON('tests/mock/childStructureTypes.json')
        );

        httpBackend.when('GET', loadLabelGroups).respond(
            readJSON('shared/volume/labelGroups.json')
        );

        // Initialize the structure.
        volumeStructures.activate();
        httpBackend.flush();
    }));

    it('Initializing volume structures', function () {
        expect(volumeStructures.getNumChildStructureTypes() == 32).toBeTruthy();
    });

    it('Initializing label groups', function () {
        expect(volumeStructures.getNumGroups() == 13).toBeTruthy();
        expect(volumeStructures.getGroupAt(0) == 'CBb').toBeTruthy();
    });

    it('Accessing label groups', function () {
        expect(volumeStructures.getGroupOfLabel('CBb4iw') == 0).toBeTruthy();
        expect(volumeStructures.getGroupOfLabel('Rod BC') == 4).toBeTruthy();
        expect(volumeStructures.getLabelsInGroup(4)[0] == 'Rod BC').toBeTruthy();
    });

    it('Accessing self and in label groups', function () {
        var groupIndex = volumeStructures.getGroupIndexInClass();
        var groupName = volumeStructures.getGroupAt(groupIndex);
        expect(groupName == 'In Class').toBeTruthy();

        groupIndex = volumeStructures.getGroupIndexSelf();
        groupName = volumeStructures.getGroupAt(groupIndex);
        expect(groupName == 'Self').toBeTruthy();
    });
});
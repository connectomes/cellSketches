describe('neighborTableData service test', function () {

    var volumeCells, volumeStructures, volumeHelpers, httpBackend, neighborTableData;

    // Testing setup
    beforeEach(function () {
        module('app.volumeModule');
    });

    beforeEach(function () {
        module('app.neighborTableModule');
    });

    beforeEach(inject(function (_volumeHelpers_, _volumeCells_, _volumeStructures_, _neighborTableData_ , $httpBackend) {
        volumeCells = _volumeCells_;
        volumeStructures = _volumeStructures_;
        volumeHelpers = _volumeHelpers_;
        httpBackend = $httpBackend;
        neighborTableData = _neighborTableData_;

        // Activate volumeStructures from the fake backend
        TestUtils.setupStructures(volumeStructures, httpBackend);

        // Activate volumeCells from the fake backend.
        TestUtils.setup(httpBackend);
        volumeCells.loadFromFile('tests/mock/volumeCells.6115.json');
        httpBackend.flush();
    }));

    it('getHeaderData - grouping by target label', function () {

        var cellIndexes = [0];
        var childType = [28];
        var useTargetLabelGroups = false;
        var useOnlySelectedTargets = false;
        var selectedTargets = undefined;
        var childrenGrouping = neighborTableData.Grouping.TARGETLABEL;

        var header = neighborTableData.getHeaderData(cellIndexes, childType, useTargetLabelGroups, useOnlySelectedTargets, selectedTargets, childrenGrouping);

        var expectedHeader = ['id', 'label', 'CBb5w', 'GAC Aii', 'null', 'Self'];

        expectedHeader.forEach(function(result, i) {
           expect(header[i] == expectedHeader[i]).toBeTruthy();
        });

    });

    it('getHeaderData - grouping by child type', function() {

        var cellIndexes = [0];
        var childType = undefined;
        var useTargetLabelGroups = false;
        var useOnlySelectedTargets = false;
        var selectedTargets = undefined;
        var childrenGrouping = neighborTableData.Grouping.CHILDTYPE;

        var header = neighborTableData.getHeaderData(cellIndexes, childType, useTargetLabelGroups, useOnlySelectedTargets, selectedTargets, childrenGrouping);

        var expectedHeader = ['id', 'label', 'R', 'PSD', 'G', 'A', 'BCS', 'MVB', 'U', 'NGadh', 'Endo', 'CPre'];

        expectedHeader.forEach(function(result, i) {
            expect(header[i] == expectedHeader[i]).toBeTruthy();
        });

        childType = [28];
        header = neighborTableData.getHeaderData(cellIndexes, childType, useTargetLabelGroups, useOnlySelectedTargets, selectedTargets, childrenGrouping);
        expectedHeader = ['id', 'label', 'G'];

        expectedHeader.forEach(function(result, i) {
            expect(header[i] == expectedHeader[i]).toBeTruthy();
        });
    });

    it('getColumnDefs - grouping by target label', function () {

        var cellIndexes = [0];
        var childType = [28];
        var useTargetLabelGroups = false;
        var useOnlySelectedTargets = false;
        var selectedTargets = undefined;
        var childrenGrouping = neighborTableData.Grouping.TARGETLABEL;

        var header = neighborTableData.getHeaderData(cellIndexes, childType, useTargetLabelGroups, useOnlySelectedTargets, selectedTargets, childrenGrouping);

        var columnDefs = neighborTableData.getColumnDefs(header, null);

        expect(columnDefs.length == 6).toBeTruthy();

        var expectedColumnDisplayNames = ['id', 'label', 'CBb5w', 'GAC Aii', 'null', 'Self'];

        columnDefs.forEach(function(columnDef, i) {
            expect(columnDef.displayName == expectedColumnDisplayNames[i]).toBeTruthy();
        });
    });

    it('getColumnDefs - grouping by child type', function() {

        var cellIndexes = [0];
        var childType = undefined;
        var useTargetLabelGroups = false;
        var useOnlySelectedTargets = false;
        var selectedTargets = undefined;
        var childrenGrouping = neighborTableData.Grouping.CHILDTYPE;

        var header = neighborTableData.getHeaderData(cellIndexes, childType, useTargetLabelGroups, useOnlySelectedTargets, selectedTargets, childrenGrouping);

        var columnDefs = neighborTableData.getColumnDefs(header, null);

        expect(columnDefs.length == 12).toBeTruthy();

        var expectedColumnDisplayNames = ['id', 'label', 'R', 'PSD', 'G', 'A', 'BCS', 'MVB', 'U', 'NGadh', 'Endo', 'CPre'];

        columnDefs.forEach(function(columnDef, i) {
            expect(columnDef.displayName == expectedColumnDisplayNames[i]).toBeTruthy();
        });
    });

    it('getTableData - grouping with target label', function() {
        var cellIndexes = [0];
        var childType = [28];
        var useTargetLabelGroups = false;
        var useOnlySelectedTargets = false;
        var selectedTargets = undefined;
        var childrenGrouping = neighborTableData.Grouping.TARGETLABEL;

        var data = neighborTableData.getTableData(cellIndexes, childType, useTargetLabelGroups, useOnlySelectedTargets, selectedTargets, childrenGrouping, 0, 100, true);

        // Check the row data. WE expect there to be 4 children connected to itself. 6 children connected to GAC Aii.
        expect(data.length == 1).toBeTruthy();
        expect(data[0].id == 6115).toBeTruthy();
        expect(data[0]['Self'].values.length == 4).toBeTruthy();
        expect(data[0]['GAC Aii'].values.length == 6).toBeTruthy();
    });

    it('getTableData - grouping by child type', function() {
        var cellIndexes = [0];
        var childType = undefined;
        var useTargetLabelGroups = false;
        var useOnlySelectedTargets = false;
        var selectedTargets = undefined;
        var childrenGrouping = neighborTableData.Grouping.CHILDTYPE;

        var data = neighborTableData.getTableData(cellIndexes, childType, useTargetLabelGroups, useOnlySelectedTargets, selectedTargets, childrenGrouping, 0, 100, true);

        expect(data[0]['G'].values.length == 25).toBeTruthy();
        expect(data[0]['R'].values.length == 196).toBeTruthy();
        expect(data[0]['PSD'].values.length == 251).toBeTruthy();
    });

    it('getTableData - grouping with target label and only selected labels', function() {
        var cellIndexes = [0];
        var childType = [28];
        var useTargetLabelGroups = false;
        var useOnlySelectedTargets = true;
        var selectedTargets = ['Self', 'GAC Aii'];
        var childrenGrouping = neighborTableData.Grouping.TARGETLABEL;

        var data = neighborTableData.getTableData(cellIndexes, childType, useTargetLabelGroups, useOnlySelectedTargets, selectedTargets, childrenGrouping, 0, 100, true);

        expect(data.length == 1).toBeTruthy();
        expect(data[0].id == 6115).toBeTruthy();
        expect(data[0]['Self'].values.length == 4).toBeTruthy();
        expect(data[0]['GAC Aii'].values.length == 6).toBeTruthy();
        expect(data[0]['CBb4w'] == undefined).toBeTruthy();
    });

    it('getTableDataAsCsv - grouping with target labels', function() {

        var cellIndexes = [0];
        var childType = [28];
        var useTargetLabelGroups = false;
        var useOnlySelectedTargets = false;
        var selectedTargets = undefined;
        var childrenGrouping = neighborTableData.Grouping.TARGETLABEL;

        var data = neighborTableData.getTableAsCsv(cellIndexes, childType, useTargetLabelGroups, useOnlySelectedTargets, selectedTargets, childrenGrouping);

        var expectedData = 'id, label, CBb5w, GAC Aii, null, Self\n6115, CBb5w, 12, 6, 3, 4\n';

        expect(data == expectedData).toBeTruthy();
    });

    it('getTableDataAsCsv - grouping with target labels and only selected labels', function() {

        var cellIndexes = [0];
        var childType = [28];
        var useTargetLabelGroups = false;
        var useOnlySelectedTargets = true;
        var selectedTargets = ['Self'];
        var childrenGrouping = neighborTableData.Grouping.TARGETLABEL;

        var data = neighborTableData.getTableAsCsv(cellIndexes, childType, useTargetLabelGroups, useOnlySelectedTargets, selectedTargets, childrenGrouping);

        var expectedData = 'id, label, Self\n6115, CBb5w, 4\n';

        expect(data == expectedData).toBeTruthy();
    });

    it('getTableDataAsCsv - grouping by child type', function() {

        var cellIndexes = [0];
        var childType = undefined;
        var useTargetLabelGroups = false;
        var useOnlySelectedTargets = false;
        var selectedTargets = undefined;
        var childrenGrouping = neighborTableData.Grouping.CHILDTYPE;

        var data = neighborTableData.getTableAsCsv(cellIndexes, childType, useTargetLabelGroups, useOnlySelectedTargets, selectedTargets, childrenGrouping);

        var expectedData = 'id, label, R, PSD, G, A, BCS, MVB, U, NGadh, Endo, CPre\n6115, CBb5w, 196, 251, 25, 91, 57, 1, 302, 2, 5, 1\n';

        expect(data == expectedData).toBeTruthy();

    });

    it('getTableDataAsCsv - grouping by child type and only selected child types', function() {

        var cellIndexes = [0];
        var childType = [28];
        var useTargetLabelGroups = false;
        var useOnlySelectedTargets = false;
        var selectedTargets = undefined;
        var childrenGrouping = neighborTableData.Grouping.CHILDTYPE;

        var data = neighborTableData.getTableAsCsv(cellIndexes, childType, useTargetLabelGroups, useOnlySelectedTargets, selectedTargets, childrenGrouping);

        var expectedData = 'id, label, G\n6115, CBb5w, 25\n';

        expect(data == expectedData).toBeTruthy();
    });
});
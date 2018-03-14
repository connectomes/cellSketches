describe('neighborTableData service test', function () {

    'use strict';

    var volumeCells, volumeStructures, volumeHelpers, httpBackend, neighborTableData;

    // Testing setup
    beforeEach(function () {
        module('app.volumeModule');
    });

    beforeEach(function () {
        module('app.neighborTableModule');
    });

    beforeEach(inject(function (_volumeHelpers_, _volumeCells_, _volumeStructures_, _neighborTableData_, $httpBackend) {
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

        expectedHeader.forEach(function (result, i) {
            expect(header[i] == expectedHeader[i]).toBeTruthy();
        });

    });

    it('getHeaderData - grouping by child type', function () {

        var cellIndexes = [0];
        var childType = undefined;
        var useTargetLabelGroups = false;
        var useOnlySelectedTargets = false;
        var selectedTargets = undefined;
        var childrenGrouping = neighborTableData.Grouping.CHILDTYPE;

        var header = neighborTableData.getHeaderData(cellIndexes, childType, useTargetLabelGroups, useOnlySelectedTargets, selectedTargets, childrenGrouping);

        var expectedHeader = ['id', 'label', 'R', 'PSD', 'G', 'A', 'BCS', 'MVB', 'U', 'NGadh', 'Endo', 'CPre'];

        expectedHeader.forEach(function (result, i) {
            expect(header[i] == expectedHeader[i]).toBeTruthy();
        });

        childType = [28];
        header = neighborTableData.getHeaderData(cellIndexes, childType, useTargetLabelGroups, useOnlySelectedTargets, selectedTargets, childrenGrouping);
        expectedHeader = ['id', 'label', 'G'];

        expectedHeader.forEach(function (result, i) {
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

        columnDefs.forEach(function (columnDef, i) {
            expect(columnDef.displayName == expectedColumnDisplayNames[i]).toBeTruthy();
        });
    });

    it('getColumnDefs - grouping by child type', function () {

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

        columnDefs.forEach(function (columnDef, i) {
            expect(columnDef.displayName == expectedColumnDisplayNames[i]).toBeTruthy();
        });
    });

    it('getColumnDefs - grouping by target label with attribute diameter', function () {

        var cellIndexes = [0];
        var childType = undefined;
        var useTargetLabelGroups = false;
        var useOnlySelectedTargets = false;
        var selectedTargets = undefined;
        var childrenGrouping = neighborTableData.Grouping.CHILDTYPE;
        var attribute = volumeHelpers.PerChildAttributes.DISTANCE;

        var header = neighborTableData.getHeaderData(cellIndexes, childType, useTargetLabelGroups, useOnlySelectedTargets, selectedTargets, childrenGrouping);

        var columnDefs = neighborTableData.getColumnDefs(header, null, attribute);

        expect(columnDefs.length == 12).toBeTruthy();

        var expectedColumnDisplayNames = ['id', 'label', 'R', 'PSD', 'G', 'A', 'BCS', 'MVB', 'U', 'NGadh', 'Endo', 'CPre'];

        columnDefs.forEach(function (columnDef, i) {
            expect(columnDef.displayName == expectedColumnDisplayNames[i]).toBeTruthy();

            //TODO: change this to use correct cell template.
            if (i > 1) {
                expect(columnDef.cellTemplate == 'neighborTable/neighborTableHistogramCell.directive.html').toBeTruthy();
            }
        });
    });

    it('getTableData - grouping with target label', function () {
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

    it('getTableData - grouping by child type', function () {
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

    it('getTableData - grouping with target label and only selected labels', function () {
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

    it('getTableData - grouping by child type with attribute diameter', function () {

        var cellIndexes = [0];
        var childType = undefined;
        var useTargetLabelGroups = false;
        var useOnlySelectedTargets = false;
        var selectedTargets = undefined;
        var childrenGrouping = neighborTableData.Grouping.CHILDTYPE;
        var attribute = volumeHelpers.PerChildAttributes.DIAMETER;

        var header = neighborTableData.getHeaderData(cellIndexes, childType, useTargetLabelGroups, useOnlySelectedTargets, selectedTargets, childrenGrouping);

        var data = neighborTableData.getTableData(cellIndexes, childType, useTargetLabelGroups, useOnlySelectedTargets, selectedTargets, childrenGrouping, 0, 100, true, attribute);

        expect(data[0]['G'].values.length == 25).toBeTruthy();
        expect(data[0]['R'].values.length == 196).toBeTruthy();
        expect(data[0]['PSD'].values.length == 251).toBeTruthy();

        // 35.66.. is the diameter of the first gap junction child of 6115.
        expect(data[0]['G'].values[0].value - (2 * 35.66166476045741)).toBeCloseTo(0);

        header.forEach(function (column, i) {
            if (i > 1) {
                data[0][column].values.forEach(function (value) {
                    expect(Number.isNaN(value.value)).toBeFalsy();
                });
            }
        });

    });

    it('getTableData - grouping by target label with attribute distance', function () {
        var cellIndexes = [0];
        var childType = [28];
        var useTargetLabelGroups = false;
        var useOnlySelectedTargets = false;
        var selectedTargets = undefined;
        var childrenGrouping = neighborTableData.Grouping.TARGETLABEL;
        var attribute = volumeHelpers.PerChildAttributes.DIAMETER;

        var data = neighborTableData.getTableData(cellIndexes, childType, useTargetLabelGroups, useOnlySelectedTargets, selectedTargets, childrenGrouping, 0, 100, true, attribute, volumeHelpers.Units.PIXELS);

        // Check the row data. We expect there to be 4 children connected to itself. 6 children connected to GAC Aii.
        expect(data.length == 1).toBeTruthy();
        expect(data[0].id == 6115).toBeTruthy();

        expect(data[0]['Self'].values.length == 4).toBeTruthy();
        expect(data[0]['Self'].values[0].value - 71.32332952091483).toBeCloseTo(0);

    });

    it('getTableDataAsCsv - grouping with target labels', function () {

        var cellIndexes = [0];
        var childType = [28, 244];
        var useTargetLabelGroups = false;
        var useOnlySelectedTargets = false;
        var selectedTargets = undefined;
        var childrenGrouping = neighborTableData.Grouping.TARGETLABEL;

        var data = neighborTableData.getTableAsCsv(cellIndexes, childType, useTargetLabelGroups, useOnlySelectedTargets, selectedTargets, childrenGrouping);

        var expectedData = 'id, label, AC (G), AC (U), CBb5w (G), CBb5w (U), GAC Aii (G), GAC Aii (U), GC (G), GC (U), null (G), null (U), Rod BC (G), Rod BC (U), Self (G), Self (U), YAC Starburst (G), YAC Starburst (U), YAC WF (G), YAC WF (U)\n6115, CBb5w, 0, 27, 12, 2, 6, 6, 0, 4, 3, 119, 0, 1, 4, 0, 0, 7, 0, 1\n';

        expect(data == expectedData).toBeTruthy();
    });

    it('getTableDataAsCsv - grouping with target labels and only selected labels', function () {

        var cellIndexes = [0];
        var childType = [28];
        var useTargetLabelGroups = false;
        var useOnlySelectedTargets = true;
        var selectedTargets = ['Self'];
        var childrenGrouping = neighborTableData.Grouping.TARGETLABEL;

        var data = neighborTableData.getTableAsCsv(cellIndexes, childType, useTargetLabelGroups, useOnlySelectedTargets, selectedTargets, childrenGrouping);

        var expectedData = 'id, label, Self (G)\n6115, CBb5w, 4\n';

        expect(data == expectedData).toBeTruthy();
    });

    it('getTableDataAsCsv - grouping by child type', function () {

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

    it('getTableDataAsCsv - grouping by child type and only selected child types', function () {

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

    it('getTableDataAsCsv - grouping by target label with attribute distance', function () {

        var cellIndexes = [0];
        var childType = [28];
        var useTargetLabelGroups = false;
        var useOnlySelectedTargets = false;
        var selectedTargets = undefined;
        var childrenGrouping = neighborTableData.Grouping.CHILDTYPE;

        var data = neighborTableData.getTableAsCsvOfChildren(cellIndexes, childType, useTargetLabelGroups, useOnlySelectedTargets, selectedTargets, childrenGrouping);

        data = data.split('\n');

        var expectedHeader = 'cell id, child id, child type, confidence, distance (px), distance (nm), target id, target label, diameter (px), diameter (nm)';

        expect(data.length == 26).toBeTruthy(); // 25 gap junctions + 1 header
        expect(data[0] == expectedHeader).toBeTruthy();

    });

    // TODO: fill this in
    it('getTableMaxValue - grouping by child type', function () {

    });

    // TODO: fill this in
    it('getTableDataMaxValue - attribute distance', function () {

    });

    it('getHistogramValuesFromList', function () {

        var cellIndexes = [0];
        var childType = undefined;
        var useTargetLabelGroups = false;
        var useOnlySelectedTargets = false;
        var selectedTargets = undefined;
        var childrenGrouping = neighborTableData.Grouping.CHILDTYPE;
        var attribute = volumeHelpers.PerChildAttributes.DIAMETER;

        var header = neighborTableData.getHeaderData(cellIndexes, childType, useTargetLabelGroups, useOnlySelectedTargets, selectedTargets, childrenGrouping);

        var data = neighborTableData.getTableData(cellIndexes, childType, useTargetLabelGroups, useOnlySelectedTargets, selectedTargets, childrenGrouping, 0, 100, true, attribute);

        var numBins = 5;
        var xAxisRange = [0, neighborTableData.histogramRowWidth];
        var xAxisDomain = [0, neighborTableData.getTableDataMaxValue(header, data, attribute)];

        // These are all the values in the first histogram bin.
        var expectedHistogramBin = [47.95950156181473, 32.85048309472224, 41.00786000632123, 38.290688208949774,
            43.81339167584409, 38.005255400154134, 38.42534901602577, 47.68056178121411, 49.112980805683144,
            34.577742882744516, 40.79576058911822, 42.12556570786024, 39.910689566869166, 48.45407105822542,
            46.233381423279695, 43.83995524587313, 49.55003315110674, 40.559750415648054, 31.362609465959977,
            42.043841534942715, 49.199975549522236, 47.22881417297261, 43.90410732921413, 38.50784205841522,
            43.74884884167198, 33.76828336977374, 37.165677108099025, 39.62854228404138, 41.910252048645205,
            35.33662439245822, 31.54498479265642, 28.75755138568101, 35.66799919294022, 41.30886822443062,
            49.66009090768645, 45.73717765364576, 37.58384452130472, 48.42961466645964, 27.670188568683503,
            39.95018926881312, 30.380567122726607, 38.41672072257779, 31.703492300413867, 40.66068478194503,
            49.497663431069256, 40.88720309667475, 35.84431350334957, 33.870243337581414, 44.49459293108306];

        var histogramValues = neighborTableData.getHistogramValues(data[0][header[2]].values, numBins, xAxisRange, xAxisDomain);

        expectedHistogramBin.forEach(function (d, i) {
            expect(histogramValues[0][i] - d).toBeCloseTo(0);
        });

    });

    it('getHistogramMaxYValueFromValues', function () {

        var cellIndexes = [0];
        var childType = undefined;
        var useTargetLabelGroups = false;
        var useOnlySelectedTargets = false;
        var selectedTargets = undefined;
        var childrenGrouping = neighborTableData.Grouping.CHILDTYPE;
        var attribute = volumeHelpers.PerChildAttributes.DIAMETER;
        var header = neighborTableData.getHeaderData(cellIndexes, childType, useTargetLabelGroups, useOnlySelectedTargets, selectedTargets, childrenGrouping);
        var data = neighborTableData.getTableData(cellIndexes, childType, useTargetLabelGroups, useOnlySelectedTargets, selectedTargets, childrenGrouping, 0, 100, true, attribute);

        var numBins = 5;
        var xAxisRange = [0, neighborTableData.histogramRowWidth];
        var xAxisDomain = [0, neighborTableData.getTableDataMaxValue(header, data, attribute)];

        var maxYValue = neighborTableData.getHistogramMaxYValueFromValues(data[0][header[2]].values, numBins, xAxisRange, xAxisDomain);

        expect(maxYValue == 127).toBeTruthy();
    });

    it('getHistogramMaxYValueFromTable', function () {

        var cellIndexes = [0];
        var childType = undefined;
        var useTargetLabelGroups = false;
        var useOnlySelectedTargets = false;
        var selectedTargets = undefined;
        var childrenGrouping = neighborTableData.Grouping.CHILDTYPE;
        var attribute = volumeHelpers.PerChildAttributes.DIAMETER;
        var header = neighborTableData.getHeaderData(cellIndexes, childType, useTargetLabelGroups, useOnlySelectedTargets, selectedTargets, childrenGrouping);
        var data = neighborTableData.getTableData(cellIndexes, childType, useTargetLabelGroups, useOnlySelectedTargets, selectedTargets, childrenGrouping, 0, 100, true, attribute);

        var numBins = 5;
        var xAxisRange = [0, neighborTableData.histogramRowWidth];
        var xAxisDomain = [0, neighborTableData.getTableDataMaxValue(header, data, attribute)];

        var maxYValue = neighborTableData.getHistogramMaxYValueFromTable(data, header, numBins, xAxisRange, xAxisDomain);

        // 136 is max size of histogram bins for this cell.s
        expect(maxYValue == 136).toBeTruthy();
    });

    it('getDetailsColumnDefs', function () {

        function checkExpectedValues(columnDefs, expectedDisplayNames) {
            expect(columnDefs.length == expectedDisplayNames.length).toBeTruthy();
            columnDefs.forEach(function (column, i) {
                expect(column.displayName == expectedDisplayNames[i]).toBeTruthy();
            });
        }

        var grouping = neighborTableData.Grouping.TARGETLABEL;
        var attribute = undefined;
        var units = volumeHelpers.Units.PIXELS;

        var expectedDisplayNames = ['target id', 'count', 'child ids'];
        var columnDefs = neighborTableData.getDetailsColumnDefs(grouping, attribute);
        checkExpectedValues(columnDefs, expectedDisplayNames);

        attribute = volumeHelpers.PerChildAttributes.DIAMETER;
        expectedDisplayNames = ['child id', 'target id', 'diameter', 'confidence'];

        columnDefs = neighborTableData.getDetailsColumnDefs(grouping, attribute);
        checkExpectedValues(columnDefs, expectedDisplayNames);
        //
        attribute = undefined;
        grouping = neighborTableData.Grouping.CHILDTYPE;

        expectedDisplayNames = ['child id', 'target label', 'target id', 'confidence'];
        columnDefs = neighborTableData.getDetailsColumnDefs(grouping, attribute);
        checkExpectedValues(columnDefs, expectedDisplayNames);

        attribute = volumeHelpers.PerChildAttributes.DIAMETER;
        expectedDisplayNames = ['child id', 'target label', 'target id', 'diameter (px)', 'confidence'];
        columnDefs = neighborTableData.getDetailsColumnDefs(grouping, attribute, units);
        checkExpectedValues(columnDefs, expectedDisplayNames);
        //
        attribute = volumeHelpers.PerChildAttributes.DISTANCE;
        expectedDisplayNames = ['child id', 'target label', 'target id', 'distance (px)', 'confidence'];
        columnDefs = neighborTableData.getDetailsColumnDefs(grouping, attribute, units);
        checkExpectedValues(columnDefs, expectedDisplayNames);

        attribute = volumeHelpers.PerChildAttributes.DISTANCE;
        units = volumeHelpers.Units.NM;
        expectedDisplayNames = ['child id', 'target label', 'target id', 'distance (nm)', 'confidence'];
        columnDefs = neighborTableData.getDetailsColumnDefs(grouping, attribute, units);
        checkExpectedValues(columnDefs, expectedDisplayNames);
    });

    it('getDetailsGridOptions', function () {

        var detailsGridOptions = neighborTableData.getDetailsGridOptions();

        // TODO: If we have row highlighting enabled in the neighborTableData then uncomment this.
        //expect(detailsGridOptions.rowTemplate == 'common/rowTemplate.html').toBeTruthy();

    });

    it('getDetailsData', function () {

        var cellIndexes = [0];
        var childType = undefined;
        var useTargetLabelGroups = false;
        var useOnlySelectedTargets = false;
        var selectedTargets = undefined;

        // No attribute, grouping by target label
        var grouping = neighborTableData.Grouping.TARGETLABEL;
        var attribute = undefined;
        var data = neighborTableData.getTableData(cellIndexes, childType, useTargetLabelGroups, useOnlySelectedTargets, selectedTargets, grouping, 0, 100, true);
        var details = neighborTableData.getDetailsData(attribute, grouping, data[0]['GAC Aii'].values);

        details.forEach(function (row) {
            expect(volumeCells.getCell(row.targetId).label == 'GAC Aii').toBeTruthy();
            expect(row.count == row.childIds.split('; ').length).toBeTruthy();
        });

        // Diameter, grouping by target label
        attribute = volumeHelpers.PerChildAttributes.DIAMETER;
        grouping = neighborTableData.Grouping.TARGETLABEL;
        data = neighborTableData.getTableData(cellIndexes, childType, useTargetLabelGroups, useOnlySelectedTargets, selectedTargets, grouping, 0, 100, true, attribute);
        details = neighborTableData.getDetailsData(attribute, grouping, data[0]['GAC Aii'].values);
        expect(details.length == 15).toBeTruthy();

        // No attribute, grouping by child type
        attribute = undefined;
        grouping = neighborTableData.Grouping.CHILDTYPE;
        data = neighborTableData.getTableData(cellIndexes, childType, useTargetLabelGroups, useOnlySelectedTargets, selectedTargets, grouping, 0, 100, true, attribute);
        details = neighborTableData.getDetailsData(attribute, grouping, data[0]['G'].values);
        expect(details.length == 25).toBeTruthy();

        // Diameter, grouping by child type
        attribute = volumeHelpers.PerChildAttributes.DIAMETER;
        grouping = neighborTableData.Grouping.CHILDTYPE;
        data = neighborTableData.getTableData(cellIndexes, childType, useTargetLabelGroups, useOnlySelectedTargets, selectedTargets, grouping, 0, 100, true, attribute);
        details = neighborTableData.getDetailsData(attribute, grouping, data[0]['G'].values);
        expect(details.length == 25).toBeTruthy();
        details.forEach(function (row) {
            expect(!isNaN(row.childValue)).toBeTruthy();
        });

    });

});
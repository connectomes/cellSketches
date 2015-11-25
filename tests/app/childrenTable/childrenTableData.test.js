describe('VolumeHelpers service test', function () {

    var volumeCells, volumeStructures, volumeHelpers, httpBackend, childrenTableData;

    // Testing setup
    beforeEach(function () {
        module('app.volumeModule');
    });

    beforeEach(function () {
        module('app.childrenTableModule');
    });

    beforeEach(inject(function (_volumeHelpers_, _volumeCells_, _volumeStructures_, _childrenTableData_, $httpBackend) {
        volumeCells = _volumeCells_;
        volumeStructures = _volumeStructures_;
        volumeHelpers = _volumeHelpers_;
        httpBackend = $httpBackend;
        childrenTableData = _childrenTableData_;

        // Activate volumeStructures from the fake backend
        TestUtils.setupStructures(volumeStructures, httpBackend);

        // Activate volumeCells from the fake backend.
        TestUtils.setup(httpBackend);
        volumeCells.loadFromFile('tests/mock/volumeCells.6115.json');
        httpBackend.flush();
    }));

    it('getHeaderData', function () {

        var expectedHeaderData = ['id', 'label', 'R', 'PSD', 'G', 'A', 'BCS', 'MVB', 'U', 'NGadh', 'Endo', 'CPre'];

        var headerData = childrenTableData.getHeaderData();

        for (var i = 0; i < headerData.length; ++i) {
            expect(headerData[i] == expectedHeaderData[i]).toBeTruthy();
        }
    });

    it('getRowData', function () {
        var cellIndexes = [0];
        var rowData = childrenTableData.getTableData(cellIndexes);
        var headerData = childrenTableData.getHeaderData();

        // Only one cell to check the row data for.
        row = rowData[0];
        console.log(row);
        // First two columns are cell id and label.
        // Remaining columns are children corresponding to the header data.
        expect(row['id'] == 6115).toBeTruthy();
        expect(row['label'] == 'CBb5w').toBeTruthy();
        headerData.forEach(function (columnName, i) {
            if (i > 2) {
                rowValue = row[columnName];
                rowValue.forEach(function (childIndex) {
                    var child = volumeCells.getCellChildAt(0, childIndex);
                    var childType = child.type;
                    var childTypeCode = volumeStructures.getChildStructureTypeCode(childType);
                    expect(childTypeCode == headerData[i]).toBeTruthy();
                });
            }
        });
    });
});
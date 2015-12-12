fdescribe('neighborTableData service test', function () {

    'use strict';

    var loadedCellsData;

    beforeEach(function () {
        module('app.loadedCellsModule');
    });

    beforeEach(inject(function (_loadedCellsData_) {
        loadedCellsData = _loadedCellsData_;
    }));

    it('getHeaderData', function () {

        var expectedHeaderData = ['status', 'id', 'label'];

        var header = loadedCellsData.getHeaderData();

        expectedHeaderData.forEach(function (column, i) {
            expect(header[i] == column).toBeTruthy();
        });

    });

    it('getColumnDefs', function () {

        var header = loadedCellsData.getHeaderData();

        var columns = loadedCellsData.getColumnDefs(header);

        header.forEach(function (column, i) {
            expect(columns[i].displayName == column).toBeTruthy();
        });

    });

    it('getInitialData', function () {

        var cellIds = [6115, 6117, 514];

        var data = loadedCellsData.getInitialData(cellIds);

        data.forEach(function (row, i) {
            expect(row.id == cellIds[i]).toBeTruthy();
            expect(loadedCellsData.Status[row.status].name == 'loading').toBeTruthy();
        })

    });

    it('updateDataStatusAndLabels', function () {

        var cellIds = [6115, 6117, 514, 1];

        var data = loadedCellsData.getInitialData(cellIds);

        var labels = ['CBb4w', 'CBb5w', 'GAC Aii'];

        var invalidIds = [1];

        var expectedLabels = ['CBb4w', 'CBb5w', 'GAC Aii', undefined];
        var expectedStatus = [0, 0, 0, 2];
        loadedCellsData.updateDataStatusAndLabels(data, cellIds, labels, invalidIds);

        data.forEach(function (row, i) {
            expect(row.label == expectedLabels[i]).toBeTruthy();
            expect(row.status == expectedStatus[i]).toBeTruthy();
        });

    });

    it('updateDataStatus', function() {

        var cellIds = [6115, 6117, 514, 1];

        var data = loadedCellsData.getInitialData(cellIds);

        var labels = ['CBb4w', 'CBb5w', 'GAC Aii'];

        var invalidIds = [1];

        loadedCellsData.updateDataStatusAndLabels(data, cellIds, labels, invalidIds);

        var expectedStatus = [1, 1, 1, 2];

        loadedCellsData.updateDataStatus(data, cellIds, expectedStatus);

        data.forEach(function (row, i) {
            expect(row.status == expectedStatus[i]).toBeTruthy();
        });

    });

    it('updateDataRemoveErrors', function() {

        var cellIds = [6115, 6117, 514, 1];

        var data = loadedCellsData.getInitialData(cellIds);

        var labels = ['CBb4w', 'CBb5w', 'GAC Aii'];

        var invalidIds = [1];

        loadedCellsData.updateDataStatusAndLabels(data, cellIds, labels, invalidIds);

        var expectedStatus = [1, 1, 1, 2];

        loadedCellsData.updateDataStatus(data, cellIds, expectedStatus);

        loadedCellsData.updateDataRemoveErrors(data);

        expect(data.length == 3).toBeTruthy();
    });

});
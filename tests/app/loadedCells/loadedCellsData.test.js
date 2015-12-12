describe('neighborTableData service test', function () {

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
            expect(row.status == loadedCellsData.Status.LOADING).toBeTruthy();
        })

    });

    it('updateDataStatusAndLabels', function () {

        var cellIds = [6115, 6117, 514, 1];

        var data = loadedCellsData.getInitialData(cellIds);

        var labels = ['CBb4w', 'CBb5w', 'GAC Aii'];

        var invalidIds = [1];

        var expectedLabels = ['CBb4w', 'CBb5w', 'GAC Aii', undefined];

        var expectedStatus = [loadedCellsData.Status.LOADING, loadedCellsData.Status.LOADING,
            loadedCellsData.Status.LOADING, loadedCellsData.Status.ERROR];

        loadedCellsData.updateDataStatusAndLabels(data, cellIds, labels, invalidIds);

        data.forEach(function (row, i) {
            expect(row.label == expectedLabels[i]).toBeTruthy();
            expect(row.status == expectedStatus[i]).toBeTruthy();
        });

    });

    it('updateDataStatus', function () {

        var cellIds = [6115, 6117, 514, 1];

        var data = loadedCellsData.getInitialData(cellIds);

        var labels = ['CBb4w', 'CBb5w', 'GAC Aii'];

        var invalidIds = [1];

        loadedCellsData.updateDataStatusAndLabels(data, cellIds, labels, invalidIds);

        var expectedStatus = [loadedCellsData.Status.LOADING, loadedCellsData.Status.LOADING,
            loadedCellsData.Status.LOADING, loadedCellsData.Status.ERROR];

        loadedCellsData.updateDataStatus(data, cellIds, expectedStatus);

        data.forEach(function (row, i) {
            expect(row.status == expectedStatus[i]).toBeTruthy();
        });

    });

    it('updateDataRemoveErrors', function () {

        var cellIds = [6115, 6117, 514, 1];

        var data = loadedCellsData.getInitialData(cellIds);

        var labels = ['CBb4w', 'CBb5w', 'GAC Aii'];

        var invalidIds = [1];

        loadedCellsData.updateDataStatusAndLabels(data, cellIds, labels, invalidIds);

        var expectedStatus = [loadedCellsData.Status.LOADING, loadedCellsData.Status.LOADING,
            loadedCellsData.Status.LOADING, loadedCellsData.Status.ERROR];

        loadedCellsData.updateDataStatus(data, cellIds, expectedStatus);

        loadedCellsData.updateDataRemoveErrors(data);

        expect(data.length == 3).toBeTruthy();
    });

    it('updateInitialData', function () {
        // When the user asks for a new set of cells, append it to the list of already loaded cells
        var cellIds = [6115, 6117, 514];

        var data = loadedCellsData.getInitialData(cellIds);

        cellIds = [6119];

        data = loadedCellsData.updateInitialData(data, cellIds);

        expect(data.length == 4).toBeTruthy();
    });

    it('Adding new cells to initial data', function () {

        var cellIds = [6115, 6117, 514, 1];

        // Create initial table data with four cell Ids
        var data = loadedCellsData.getInitialData(cellIds);

        var labels = ['CBb4w', 'CBb5w', 'GAC Aii'];

        var invalidIds = [1];

        // Update the cell labels
        loadedCellsData.updateDataStatusAndLabels(data, cellIds, labels, invalidIds);

        // Update the status of the cells
        var expectedStatus = [loadedCellsData.Status.LOADING, loadedCellsData.Status.LOADING,
            loadedCellsData.Status.LOADING, loadedCellsData.Status.ERROR];

        loadedCellsData.updateDataStatus(data, cellIds, expectedStatus);

        loadedCellsData.updateDataRemoveErrors(data);

        // Load another cell
        cellIds = [6119];

        // data now has 3 cells that area already loaded and one cell that is being loaded
        data = loadedCellsData.updateInitialData(data, cellIds);

        expect(data.length == 4).toBeTruthy();

        labels = ['CBb5w'];

        // the new cell now has a label
        loadedCellsData.updateDataStatusAndLabels(data, cellIds, labels, []);

        expect(data[3].id == cellIds[0]).toBeTruthy();
        expect(data[3].label == labels[0]).toBeTruthy();

        expectedStatus = [loadedCellsData.Status.OK];

        // data should have four cells that are all loaded
        loadedCellsData.updateDataStatus(data, cellIds, expectedStatus);

        expect(data[3].status == expectedStatus[0]).toBeTruthy();

    });

});
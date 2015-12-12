(function () {
    'use strict';

    angular
        .module('app.loadedCellsModule')
        .factory('loadedCellsData', loadedCellsData);

    loadedCellsData.$inject = ['$log', 'volumeCells'];

    function loadedCellsData($log, volumeCells) {

        var self = this;

        self.Status = [
            {
                name: 'loading',
                id: 0
            },
            {
                name: 'done',
                id: 1
            },
            {
                name: 'error',
                id: -1
            }
        ];

        var service = {
            getColumnDefs: getColumnDefs,
            getInitialData: getInitialData,
            getHeaderData: getHeaderData,
            updateDataStatus: updateDataStatus,
            updateDataStatusAndLabels: updateDataStatusAndLabels,
            updateDataRemoveErrors: updateDataRemoveErrors
        };

        service.Status = self.Status;

        return service;

        function getColumnDefs(header) {
            var columns = [];

            header.forEach(function (column, i) {
                columns.push({
                    field: column,
                    displayName: column,
                    width: 100
                });
            });

            return columns;
        }

        function getHeaderData() {
            return ['status', 'id', 'label'];
        }

        function getInitialData(cellIds) {

            var rows = [];

            cellIds.forEach(function (cellId) {
                var row = {
                    status: 0,
                    id: cellId,
                    label: '-'
                };

                rows.push(row);
            });

            return rows;

        }

        function updateDataStatusAndLabels(data, cellIds, labels, invalidCellIds) {

            // Update the status of invalidCellIds to 'error'
            if (invalidCellIds.length > 0) {
                invalidCellIds.forEach(function (cellId) {
                    data.forEach(function (row) {
                        if (row.id == cellId) {
                            row.status = 2;
                        }
                    });
                });
            }

            cellIds.forEach(function (cellId, i) {
                data.forEach(function (row) {
                    if (row.id == cellId) {
                        row.label = labels[i];
                    }
                });
            });
        }

        function updateDataStatus(data, cellIds, status) {
            cellIds.forEach(function (cellId, i) {
                data.forEach(function (row) {
                    if (row.id == cellId) {
                        row.status = status[i];
                    }
                });
            });
        }

        function updateDataRemoveErrors(data) {
            for (var i = 0; i < data.length; ++i) {
                if (data[i].status == 2) {
                    data = data.splice(i, 1);
                }
            }
        }

    }

})();


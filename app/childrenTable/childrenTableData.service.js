(function () {
    'use strict';

    angular
        .module('app.childrenTableModule')
        .factory('childrenTableData', childrenTableData);

    childrenTableData.$inject = ['$log', 'volumeCells', 'volumeStructures'];

    function childrenTableData($log, volumeCells, volumeStructures) {

        var self = this;

        return {
            getHeaderData: getHeaderData,
            getTableAsCsv: getTableAsCsv,
            getTableData: getTableData,
            getTableDataBounds: getTableDataBounds
        };

        /**
         * @name getHeaderData
         * @returns List of strings to appear in the table of cell children.
         */
        function getHeaderData() {
            var headerData = [];

            headerData.push('id');
            headerData.push('label');

            var childTypes = volumeCells.getAllAvailableChildTypes();

            childTypes.forEach(function (childType) {
                headerData.push(volumeStructures.getChildStructureTypeCode(childType))
            });

            return headerData;
        }

        /**
         * @name getTableAsCsv
         * @returns String csv of the current table (header + data).
         */
        function getTableAsCsv(cellIndexes) {

        }

        /**
         * @name getTableData
         * @returns List of Lists containing values for childrenTable.
         */
        function getTableData(cellIndexes) {

            var childTypes = volumeCells.getAllAvailableChildTypes();
            var headerData = getHeaderData();
            var tableData = [];

            cellIndexes.forEach(function (cellIndex) {
                var rowData = {};
                var cell = volumeCells.getCellAt(cellIndex);
                rowData['id'] = cell.id;
                rowData['label'] = cell.label;


                childTypes.forEach(function (childType, i) {
                    var children = volumeCells.getCellChildrenByTypeIndexes(cellIndex, childType);
                    rowData[headerData[i + 2]] = children;
                });


                tableData.push(rowData)
            });

            return tableData;

        }

        /**
         * @name getTableDataBounds
         * @returns Object{minValue, maxValue} that appear in the table data.
         */
        function getTableDataBounds(cellIndexes) {

        }

    }

})();

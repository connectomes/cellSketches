(function () {
    'use strict';

    angular.module('app.template')
        .controller('ExampleController', ExampleController);

    // Order here has to match the parameters of the ExampleController function.
    ExampleController.$inject = ['$scope', '$q', 'volumeOData', 'volumeBounds', 'volumeLayers', 'volumeCells', 'volumeStructures'];

    function ExampleController($scope, $q, volumeOData, volumeBounds, volumeLayers, volumeCells, volumeStructures) {

        var self = this;
        self.cells = [];

        function cellsLoaded(results) {
            self.cells = results[0].validIds;
            var numCells = self.cells.length;
            var promises = []; // Load cell children that the user asked for.

            for (var j = 0; j < numCells; ++j) {
                var cellIndex = volumeCells.getCellIndex(self.cells[j]);
                promises[j] = volumeCells.loadCellChildrenAt(cellIndex);
            }

            // Load all cell neighbors and locations
            $q.all(promises).then(childrenLoaded, cellsFailed);

        }

        function cellsFailed(results) {
            console.log('shit');
        }

        function childrenLoaded() {

            var promises = [];

            for (var j = 0; j < self.cells.length; ++j) {
                var cellIndex = volumeCells.getCellIndex(self.cells[j]);
                promises.push(volumeCells.loadCellChildrenEdgesAt(cellIndex));
                promises.push(volumeCells.loadCellLocationsAt(cellIndex));
            }

            $q.all(promises).then(edgesLoaded, cellsFailed);

        }

        function edgesLoaded() {

            var promises = [];

            for (var j = 0; j < self.cells.length; ++j) {
                var cellIndex = volumeCells.getCellIndex(self.cells[j]);
                promises.push(volumeCells.loadCellNeighborsAt(cellIndex));
            }

            $q.all(promises).then(neighborsLoaded, cellsFailed);

        }

        function neighborsLoaded() {

            /*
             var data = '';
             for (var i = 0; i < volumeStructures.getNumChildStructureTypes(); ++i) {
             var childTypeId = volumeStructures.getChildStructureTypeAt(i);
             var children = volumeCells.getCellChildrenByTypeIndexes(0, childTypeId);
             console.log(childTypeId + ', ' + children.length);
             var neighbors = [];
             for (var j = 0; j < children.length; ++j) {
             var childIndex = children[j];
             var cellPartner = volumeCells.getCellChildPartnerAt(0, childIndex);
             for(var k=0; k<cellPartner.parentId.length; ++k) {
             neighbors.push(cellPartner.parentId);
             data = data + childTypeId + ', ' + volumeCells.getCellChildAt(0, childIndex).id + ', ' + cellPartner.parentId[k] + '\n';
             }
             }
             }*/
            var availableChildTypes = volumeCells.getAllAvailableChildTypes();
            var availableGroups = volumeCells.getAllAvailableGroups();
            var data = 'child type, ';

            for (var j = 0; j < availableGroups.length; ++j) {
                data = data + volumeStructures.getGroupAt(j) + ', ';
            }

            data += '\n';
            console.log(self.cells);
            for (var i = 0; i < self.cells.length; ++i) {
                var cellIndex = volumeCells.getCellIndex(self.cells[i]);

                for (var k = 0; k < availableChildTypes.length; ++k) {
                    var currChildType = availableChildTypes[k];
                    data += volumeStructures.getChildStructureTypeNameAt(k) + ', ';
                    for (j = 0; j < availableGroups.length; ++j) {
                        var currGroup = availableGroups[j];
                        var childrenInGroup = volumeCells.getCellChildrenConnectedToGroupIndex(cellIndex, currGroup, currChildType).indexes;
                        data += childrenInGroup.length + ', ';
                    }
                    data += '\n';
                }
            }

            var blob = new Blob([data], {type: "text"});
            saveAs(blob, 'test.csv');
        }

        function activate() {

            d3.select('body')
                .append('div')
                .html('Hello world');

            var cellId = 606;
            volumeStructures.activate().then(function () {
                volumeStructures.activateCellLabelGroups().then(function() {
                    volumeCells.loadCellIds([6117, 6115]).then(cellsLoaded, cellsFailed);
                });
            });
        }

        activate();
    }

})
();

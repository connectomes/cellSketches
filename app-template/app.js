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
                promises.push(volumeCells.loadCellChildPartnersAt(cellIndex));
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


            var data, blob, i, j, k;

            data = '';

            d3.select('body')
                .append('div')
                .html('<h5> Children of cell ' + volumeCells.getCellAt(0).id + '</h4>');

            for (i = 0; i < volumeStructures.getNumChildStructureTypes(); ++i) {
                var childTypeId = volumeStructures.getChildStructureTypeAt(i);
                var children = volumeCells.getCellChildrenByTypeIndexes(0, childTypeId);
                console.log(childTypeId + ', ' + children.length);
                d3.select('body').append('div').html(childTypeId + ': ' + children.length + '<br>');
                var neighbors = [];
                for ( j = 0; j < children.length; ++j) {
                    var childIndex = children[j];
                    var cellPartner = volumeCells.getCellChildPartnerAt(0, childIndex);
                    for ( k = 0; k < cellPartner.neighborIds.length; ++k) {
                        neighbors.push(cellPartner.neighborIds);
                        data = data + childTypeId + ', ' + volumeCells.getCellChildAt(0, childIndex).id + ', ' + cellPartner.neighborIds[k] + '\n';
                    }
                }
            }

            blob = new Blob([data], {type: "text"});
            saveAs(blob, 'jsResults1.csv');

            /*
            // Saving neighbors to csv grouped by super-labels.
            var availableChildTypes = volumeCells.getAllAvailableChildTypes();
            var availableGroups = volumeCells.getAllAvailableGroups();
            data = 'child type, ';

            for (j = 0; j < availableGroups.length; ++j) {
                data = data + volumeStructures.getGroupAt(availableGroups[j]) + ', ';
            }

            data += '\n';
            console.log(self.cells);
            for (i = 0; i < self.cells.length; ++i) {
                var cellIndex = volumeCells.getCellIndex(self.cells[i]);

                for (k = 0; k < availableChildTypes.length; ++k) {
                    var currChildType = availableChildTypes[k];
                    data += volumeStructures.getChildStructureTypeName(currChildType) + ', ';
                    for (j = 0; j < availableGroups.length; ++j) {
                        var currGroup = availableGroups[j];
                        var results = volumeCells.getCellChildrenConnectedToGroupIndex(cellIndex, currGroup, currChildType);
                        var childrenInGroup = results.indexes;
                        var offsetsInGroup = results.partners;

                        for (var n = 0; n < childrenInGroup.length; ++n) {
                            var currChild = volumeCells.getCellChildAt(cellIndex, childrenInGroup[n]);
                            assert(currChild.type == currChildType, "Wrong child type found!");
                            var currPartner = volumeCells.getCellChildPartnerAt(cellIndex, childrenInGroup[n]);
                            var otherCell = volumeCells.getCell(currPartner.neighborIds[offsetsInGroup[n]]);
                            if (currGroup != volumeStructures.getGroupIndexInClass() && currGroup != volumeStructures.getGroupIndexSelf()) {

                                assert(volumeStructures.isLabelInGroup(otherCell.label, currGroup), "Found cell in wrong label!");

                            }

                        }
                        data += childrenInGroup.length + ', ';
                    }
                    data += '\n';
                }
                data += '\n';
            }

            blob = new Blob([data], {type: "text"});
            saveAs(blob, 'test.csv');
            */
        }

        function assert(condition, message) {
            if (!condition) {
                throw message;
            }
        }

        function activate() {

            d3.select('body')
                .append('div')
                .html('Hello world');


            // Returns a link with child 47822 connected directly to a cell 88413
            // http://websvc1.connectomes.utah.edu/RC1/OData/StructureLinks?$filter=(SourceID%20eq%2047822%20or%20TargetID%20eq%2047822)
            //var cellIds = [606];

            // Returns a link with child that is both a source and a target.
            // http://websvc1.connectomes.utah.edu/RC1/OData/StructureLinks?$filter=(SourceID%20eq%205047%20or%20TargetID%20eq%205047)
            // var cellIds = [514];

            // Returns a link with child that is both source and a target
            // Returns a cell child with no locations 37656
            var cellIds = [3679];

            //var cellIds = [170, 307, 324, 330, 5468, 5513, 5530, 5534, 5601, 5650, 5729, 6117, 7024, 48516, 25155]
            //var cellIds = [6115, 6117];
            volumeStructures.activate().then(function () {
                volumeCells.loadCellIds(cellIds).then(cellsLoaded, cellsFailed);
            });
        }

        activate();
    }

})
();

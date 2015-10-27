(function () {
    'use strict';

    angular.module('app.template')
        .controller('ExampleController', ExampleController);

    // Order here has to match the parameters of the ExampleController function.
    ExampleController.$inject = ['$scope', '$q', 'volumeOData', 'volumeBounds', 'volumeLayers', 'volumeCells', 'volumeStructures'];

    function ExampleController($scope, $q, volumeOData, volumeBounds, volumeLayers, volumeCells, volumeStructures) {

        var self = this;

        function cellsLoaded(results) {
            var cells = results[0].validIds;
            var numCells = cells.length;
            var promises = []; // Load cell children that the user asked for.
            for (var j = 0; j < numCells; ++j) {
                var cellIndex = volumeCells.getCellIndex(cells[j]);
                promises[j] = volumeCells.loadCellChildrenAt(cellIndex);
            }

            // Load all cell neighbors and locations
            $q.all(promises).then(function () {
                promises = [];

                for (var j = 0; j < numCells; ++j) {
                    var cellIndex = volumeCells.getCellIndex(cells[j]);
                    promises.push(volumeCells.loadCellChildrenEdgesAt(cellIndex));
                    promises.push(volumeCells.loadCellLocationsAt(cellIndex));
                }

                $q.all(promises).then(function () {

                    volumeCells.loadCellNeighborsAt(0).then(function () {
                        // Now we're finished loading cells from http.
                        var data = '';
                        for (var i = 0; i < volumeStructures.getNumChildStructureTypes(); ++i) {
                            var childTypeId = volumeStructures.getChildStructureTypeAt(i);
                            var children = volumeCells.getCellChildrenByTypeIndexes(0, childTypeId);
                            console.log(childTypeId + ', ' + children.length);
                            var neighbors = [];
                            for (j = 0; j < children.length; ++j) {
                                var childIndex = children[j];
                                var cellPartner = volumeCells.getCellChildPartnerAt(0, childIndex);
                                for(var k=0; k<cellPartner.parentId.length; ++k) {
                                    neighbors.push(cellPartner.parentId);
                                    data = data + childTypeId + ', ' + volumeCells.getCellChildAt(0, childIndex).id + ', ' + cellPartner.parentId[k] + '\n';
                                }

                            }
                        }


                        var blob = new Blob([data], {type: "text"});
                        saveAs(blob, 'test.csv');

                    });
                });
            });
        }

        function cellsFailed(results) {
            console.log('shit');
        }

        function activate() {

            d3.select('body')
                .append('div')
                .html('Hello world');

            var cellId = 606;
            volumeStructures.activate().then(function () {
                volumeCells.loadCellId(606).then(cellsLoaded, cellsFailed);
            });
        }


        activate();
    }

})
();

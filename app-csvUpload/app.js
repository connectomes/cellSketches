(function () {
    'use strict';

    angular.module('app.csvUpload')
        .controller('ExampleController', ExampleController);

    // Order here has to match the parameters of the ExampleController function.
    ExampleController.$inject = ['$scope', '$q', 'volumeOData', 'volumeBounds', 'volumeLayers', 'volumeCells', 'volumeStructures'];

    function ExampleController($scope, $q, volumeOData, volumeBounds, volumeLayers, volumeCells, volumeStructures) {
        $scope.cellsLoaded = false;
        $scope.cellsLoaded = false;
        $scope.cellsLoading = false;
        $scope.childType = 28;
        $scope.checked = true;
        $scope.units = 'nm';
        $scope.singleCell = undefined;
        $scope.cellIdsSelected = function (sets) {
            $scope.cellsLoading = true;
            $scope.cells = [];
            $scope.masterCells = [];
            var c = {};
            c.indexes = sets[0].cells;
            $scope.cells.push(c);
            $scope.masterCells.push(c);
            for (var i = 0; i < sets.length; ++i) {
                var currSet = sets[i];
                volumeCells.loadCellIds(currSet.cells).then(function () {
                    var promises = [];
                    var numCells = volumeCells.getNumCells();
                    for (var j = 0; j < numCells; ++j) {
                        promises[j] = volumeCells.loadCellChildrenAt(j);
                    }

                    $q.all(promises).then(function () {
                        promises = [];

                        for (j = 0; j < numCells; ++j) {
                            promises.push(volumeCells.loadCellNeighborsAt(j));
                            promises.push(volumeCells.loadCellLocationsAt(j));
                        }

                        $q.all(promises).then(function () {
                            $scope.cells[0].ids = [];
                            for (j = 0; j < $scope.cells[0].indexes.length; ++j) {
                                $scope.saveCellNeighborsAsCsv($scope.cells[0].indexes[j]);
                                $scope.cells[0].ids.push($scope.cells[0].indexes[j]);
                                $scope.cells[0].indexes[j] = volumeCells.getCellIndex($scope.cells[0].indexes[j]);
                                $scope.masterCells = angular.copy($scope.cells);
                                $scope.cellsLoading = false;
                                $scope.cellsLoaded = true;
                            }
                            $scope.$broadcast('cellsChanged', $scope.cells, $scope.childType, $scope.useSecondaryCells, $scope.secondaryCells);

                        });
                    });
                });
            }
        };

        $scope.saveCellNeighborsAsCsv = function (cellId) {
            console.log('creating csv for: ' + cellId);
            var index = volumeCells.getCellIndex(cellId);
            var children = volumeCells.getCellChildrenByTypeIndexes(index, 28);
            var centroid = volumeCells.getCellConvexHullAt(index).centroid();
            centroid = new utils.Point2D(centroid[0], centroid[1]);
            var str = "";
            for(var i=0; i<children.length; ++i) {
                var child = volumeCells.getCellChildAt(index, children[i]);
                var locations = volumeCells.getCellChildLocationsAt(index, i);
                var childCenter = new utils.Point2D(0.0, 0.0);
                for(var j=0; j<locations.length; ++j) {
                    childCenter = childCenter.add(locations[j].position.getAs2D());
                }
                childCenter = childCenter.multiply(1.0 / locations.length);
                var distancePx = childCenter.distance(centroid);
                var distanceNm = childCenter.distance(centroid) * utils.nmPerPixel;
                var partner = volumeCells.getCellChildPartnerAt(index, children[i]);
                if(partner.parentId != -1) {
                    var partnerCell = volumeCells.getCell(partner.parentId);
                    str = str + cellId + ', ' + child.id + ', ' + child.type + ', ' + distancePx + ', ' + distanceNm + ', ' + partnerCell.id + ', ' + partnerCell.label + '\n';
                }
            }
            return str;
        };

        $scope.selectionChanged = function(useAllCells) {
            if(useAllCells) {
                $scope.cells = angular.copy($scope.masterCells);
            } else {
                $scope.cells[0].ids = [];
                $scope.cells[0].indexes = [];
                $scope.cells[0].ids.push(this.singleCell);
                $scope.cells[0].indexes.push(volumeCells.getCellIndex(this.singleCell));
            }
            $scope.$broadcast('cellsChanged', $scope.cells, $scope.childType, $scope.useSecondaryCells, $scope.secondaryCells, this.units == "nm");
        };

        $scope.saveCurrentCellChildrenData = function() {
            var indexes = $scope.cells[0].indexes;
            var data = "";
            for(var i=0; i<indexes.length; ++i) {
              data = data + $scope.saveCellNeighborsAsCsv(volumeCells.getCellAt(indexes[i]).id);
            }
            console.log(data);
        };

        $scope.unitsChanged = function() {
            console.log($scope.units);
            $scope.$broadcast('cellsChanged', $scope.cells, $scope.childType, $scope.useSecondaryCells, $scope.secondaryCells, this.units == "nm");
        };
    }

})();

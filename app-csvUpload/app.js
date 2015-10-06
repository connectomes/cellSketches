(function () {
    'use strict';

    angular.module('app.csvUpload')
        .controller('ExampleController', ExampleController);

    // Order here has to match the parameters of the ExampleController function.
    ExampleController.$inject = ['$scope', '$q', 'volumeOData', 'volumeBounds', 'volumeLayers', 'volumeCells', 'volumeStructures'];

    function ExampleController($scope, $q, volumeOData, volumeBounds, volumeLayers, volumeCells, volumeStructures) {
        var self = this;

        // $scope.model is shared between different instances of this controller. It gets initialized when the
        // application starts. References to $scope.model are copied to other instances of the controller.
        $scope.model = $scope.model || {
                // variables controlled by ui elements.
                ui: {
                    allCellsChecked: true,
                    units: 'nm',
                    selectedCells: [],
                    selectedChildTypes: ["Gap Junction", "Unknown"]
                },

                // all available cells to be displayed
                masterCells: {
                    ids: [],
                    indexes: []
                },

                // all available child types
                masterChildTypes: {
                    ids: [],
                    names: []
                },

                // cells and childType are what the user has currently selected
                cells: {ids: [], indexes: []},
                childType: [28, 244],

                // current state of loading cells
                cellsLoading: false,
                cellsLoaded: false,
                isActivated: false
            };

        $scope.activate = function () {

            // Fence to stop multiple activations
            if (!$scope.model.isActivated) {
                $scope.model.isActivated = true;
                volumeStructures.activate().then(parseMasterChildTypes);
            }

            function parseMasterChildTypes() {
                var numChildStructureTypes = volumeStructures.getNumChildStructureTypes();
                for (var i = 0; i < numChildStructureTypes; ++i) {
                    $scope.model.masterChildTypes.ids.push(volumeStructures.getChildStructureTypeAt(i));
                    $scope.model.masterChildTypes.names.push(volumeStructures.getChildStructureTypeNameAt(i));
                }
            }
        };

        $scope.broadcastChange = function () {
            $scope.$broadcast('cellsChanged', $scope.model.cells, $scope.model.childType, $scope.useSecondaryCells, $scope.secondaryCells, $scope.model.ui.units == 'nm');
        };

        $scope.cellIdsSelected = function (cells) {
            $scope.model.cellsLoading = true;
            $scope.model.cellsLoaded = false;
            self.cells = cells;
            volumeCells.reset();
            // Load cells that the user asked for.
            volumeCells.loadCellIds(self.cells).then(function () {
                var promises = [];
                var numCells = self.cells.length;

                // Load cell children that the user asked for.
                for (var j = 0; j < numCells; ++j) {
                    var cellIndex = volumeCells.getCellIndex(self.cells[j]);
                    promises[j] = volumeCells.loadCellChildrenAt(cellIndex);
                }

                // Load all cell neighbors and locations
                $q.all(promises).then(function () {
                    promises = [];

                    for (var j = 0; j < numCells; ++j) {
                        var cellIndex = volumeCells.getCellIndex(self.cells[j]);
                        promises.push(volumeCells.loadCellNeighborsAt(cellIndex));
                        promises.push(volumeCells.loadCellLocationsAt(cellIndex));
                    }

                    $q.all(promises).then(function () {
                        // Now we're finished loading cells from http.
                        numCells = self.cells.length;
                        $scope.model.masterCells.ids = [];
                        $scope.model.masterCells.indexes = [];
                        for (var i = 0; i < numCells; ++i) {
                            var currId = self.cells[i];
                            $scope.model.masterCells.ids.push(currId);
                            $scope.model.masterCells.indexes.push(volumeCells.getCellIndex(currId));
                        }

                        // Finished loading.
                        $scope.model.cellsLoading = false;
                        $scope.model.cellsLoaded = true;

                        // All cells are selected by default.
                        $scope.model.ui.selectedCells = angular.copy($scope.model.masterCells);
                        $scope.model.cells = angular.copy($scope.model.masterCells);
                        $scope.broadcastChange();
                    });
                });
            });

        };

        $scope.childTypesChanged = function () {
            var childTypes = [];

            for (var i = 0; i < $scope.model.ui.selectedChildTypes.length; ++i) {
                var name = $scope.model.ui.selectedChildTypes[i];
                var index = $scope.model.masterChildTypes.names.indexOf(name);
                var childType = $scope.model.masterChildTypes.ids[index];

                childTypes.push(childType);
            }

            $scope.model.childType = childTypes;
            $scope.broadcastChange();
        };

        $scope.saveCellNeighborsAsCsv = function (cellId) {
            var index = volumeCells.getCellIndex(cellId);
            var children = volumeCells.getCellChildrenByTypeIndexes(index, $scope.model.childType);

            // centroid is center of cell's convex hull
            var centroid = volumeCells.getCellConvexHullAt(index).centroid();
            centroid = new utils.Point2D(centroid[0], centroid[1]);

            var str = "";
            var numChildren = children.length;
            for (var i = 0; i < numChildren; ++i) {
                var child = volumeCells.getCellChildAt(index, children[i]);
                var locations = volumeCells.getCellChildLocationsAt(index, i);
                var childCenter = new utils.Point2D(0.0, 0.0);

                // child center is average of child locations
                for (var j = 0; j < locations.length; ++j) {
                    childCenter = childCenter.add(locations[j].position.getAs2D());
                }

                childCenter = childCenter.multiply(1.0 / locations.length);

                var distancePx = childCenter.distance(centroid);
                var distanceNm = childCenter.distance(centroid) * utils.nmPerPixel;
                var partner = volumeCells.getCellChildPartnerAt(index, children[i]);

                if (partner.parentId != -1) {
                    var partnerCell = volumeCells.getCell(partner.parentId);
                } else {
                    partnerCell = {id: -1, label: 'undefined'};
                }
                str = str + cellId + ', ' + child.id + ', ' + child.type + ', ' + child.confidence + ',' + distancePx + ', ' + distanceNm + ', ' + partnerCell.id + ', ' + partnerCell.label + '\n';
            }
            return str;
        };

        $scope.saveCurrentCellChildrenData = function () {
            var indexes = $scope.model.cells.indexes;
            var data = "parent id, child id, child type, child confidence, distance (px), distance (nm), child target id, child target label\n";

            var numIndexes = indexes.length;
            for (var i = 0; i < numIndexes; ++i) {
                data = data + $scope.saveCellNeighborsAsCsv(volumeCells.getCellAt(indexes[i]).id);
            }
            var blob = new Blob([data], {type: "text"});

            saveAs(blob, 'data.csv');
        };

        $scope.selectionChanged = function () {
            $scope.model.cells.ids = [];
            $scope.model.cells.indexes = [];

            if ($scope.model.ui.allCellsChecked) {
                $scope.model.cells = angular.copy($scope.model.masterCells);
            } else {
                var numSelectedCells = $scope.model.ui.selectedCells.length;
                for (var i = 0; i < numSelectedCells; ++i) {
                    $scope.model.cells.ids.push($scope.model.ui.selectedCells[i]);
                    $scope.model.cells.indexes.push(volumeCells.getCellIndex($scope.model.ui.selectedCells[i]));
                }
            }
            $scope.broadcastChange();
        };

        $scope.unitsChanged = function () {
            $scope.broadcastChange();
        };

        $scope.activate();
    }

})();

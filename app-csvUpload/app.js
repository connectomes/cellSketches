(function () {
    'use strict';

    angular.module('app.csvUpload')
        .controller('ExampleController', ExampleController);

    // Order here has to match the parameters of the ExampleController function.
    ExampleController.$inject = ['$scope', '$q', 'volumeOData', 'volumeBounds', 'volumeLayers', 'volumeCells', 'volumeStructures'];

    function ExampleController($scope, $q, volumeOData, volumeBounds, volumeLayers, volumeCells, volumeStructures) {
        var self = this;
        self.verbose = true;

        // $scope.model is shared between different instances of this controller. It gets initialized when the
        // application starts. References to $scope.model are copied to other instances of the controller.
        $scope.model = $scope.model || {
                // variables controlled by ui elements.
                ui: {
                    allCellsChecked: true,
                    units: 'nm',
                    selectedCells: [],
                    selectedChildTypes: ["Gap Junction", "Unknown"],
                    selectedChildAttribute: 'Distance from center'
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

                // all available child attributes
                masterChildAttributes: [
                    'Distance from center',
                    'Diameter'
                ],

                // cells that were requested but not loaded
                invalidIds: [],

                // cells and childType are what the user has currently selected
                cells: {ids: [], indexes: []},
                childType: [28, 244],

                // current state of loading cells
                cellsLoading: false,
                cellsLoaded: false,
                isActivated: false,
                usingRemote: true
            };

        $scope.activate = function () {

            // Allow only one activation
            if (!$scope.model.isActivated) {
                $scope.model.isActivated = true;

                // TODO: Error handling here.
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
            $scope.$broadcast('cellsChanged', $scope.model.cells, $scope.model.childType, $scope.useSecondaryCells, $scope.secondaryCells, $scope.model.ui.units == 'nm', $scope.model.ui.selectedChildAttribute == 'Diameter');
        };

        $scope.cellIdsSelected = function (cells) {
            $scope.model.cellsLoading = true;
            $scope.model.cellsLoaded = false;

            cells = [6115, 6117];

            volumeCells.reset();
            volumeCells.loadCellIds(cells).then(cellsLoadedSuccess, cellsLoadedFailure);

            /*
             // Example of how to hack response from the server.
             // Finished loading.
             self.cells = [];
             for(i=0; i<4; ++i) {
             self.cells.push(volumeCells.getCellAt(i).id);
             }
             $scope.model.cellsLoading = false;
             $scope.model.cellsLoaded = true;
             var numCells = self.cells.length;
             $scope.model.masterCells.ids = [];
             $scope.model.masterCells.indexes = [];
             for (var i = 0; i < numCells; ++i) {
             var currId = self.cells[i];
             $scope.model.masterCells.ids.push(currId);
             $scope.model.masterCells.indexes.push(volumeCells.getCellIndex(currId));
             }
             // All cells are selected by default.
             $scope.model.ui.selectedCells = angular.copy($scope.model.masterCells);
             $scope.model.cells = angular.copy($scope.model.masterCells);
             $scope.broadcastChange();
             */
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
                if (locations.length > 1) {
                    var distancePx = childCenter.distance(centroid);
                    var distanceNm = childCenter.distance(centroid) * utils.nmPerPixel;
                    var diameterPx = volumeCells.getCellChildRadiusAt(index, children[i]) * 2;
                    var diameterNm = diameterPx * utils.nmPerPixel;
                } else {
                    distancePx = 'null';
                    distanceNm = 'null';
                    diameterPx = 'null';
                    diameterNm = 'null';
                }
                var partner = volumeCells.getCellChildPartnerAt(index, children[i]);

                if (partner.parentId != -1) {
                    var partnerCell = volumeCells.getCell(partner.parentId);
                } else {
                    partnerCell = {id: -1, label: 'undefined'};
                }
                str = str + cellId + ', ' + child.id + ', ' + child.type + ', ' + child.confidence + ',' + distancePx + ', ' + distanceNm + ', ' + partnerCell.id + ', ' + partnerCell.label + ', ' + diameterPx + ', ' + diameterNm + '\n'
            }
            return str;
        };

        $scope.saveCurrentCellChildrenData = function () {
            var indexes = $scope.model.cells.indexes;
            var data = "parent id, child id, child type, child confidence, distance (px), distance (nm), child target id, child target label, max diameter (px), max diameter (nm)\n";

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

        // These functions are chained together for async callbacks. The order they get called in:
        // 1. cellsLoadedSuccess -- this updates the scope's masterCells
        // 2. cellChildrenSuccess
        // 3. cellLocationsSuccess
        // 4. cellChildrenEdgesSuccess
        // 5. cellNeighborsSuccess
        // 6. cellsFinished -- this tells the scope to broadcast changes
        // If any of the http requests fail, then alert the user and give up.
        function cellChildrenFailure(results) {
            alert('cellChildrenFailure' + results);
        }

        function cellChildrenSuccess(results) {

            if (self.verbose) {
                console.log('Cell children loaded successfully: ');
                console.log(results);
            }

            var cellIndexes = getIndexesFromResults(results);
            var promises = [];

            for (var i = 0; i < cellIndexes.length; ++i) {
                var cellIndex = cellIndexes[i];
                promises.push(volumeCells.loadCellLocationsAt(cellIndex));
            }

            $q.all(promises).then(cellLocationsSuccess, cellLocationsFailure);
        }

        function cellChildrenEdgesFailure(results) {
            alert('cellChildrenEdgesFailure' + results);

        }

        function cellChildrenEdgesSuccess(results) {
            if (self.verbose) {
                console.log('Cell children edges loaded successfully: ');
                console.log(results);
            }

            var cellIndexes = getIndexesFromResults(results);
            var promises = [];

            for (var i = 0; i < cellIndexes.length; ++i) {
                var cellIndex = cellIndexes[i];
                promises.push(volumeCells.loadCellNeighborsAt(cellIndex));
            }

            $q.all(promises).then(cellNeighborsSuccess, cellNeighborsFailure);
        }

        function cellsLoadedFailure(results) {
            $scope.model.invalidIds = angular.copy(results.invalidIds);
            cellsLoadedSuccess([results]);
        }

        function cellsLoadedSuccess(results) {

            if (self.verbose) {
                console.log('Cells loaded successfully: ');
                console.log(results);
            }

            var promises = [];
            var cells = results[0].validIds;
            var numCells = cells.length;

            // Load cell children that the user asked for.
            for (var j = 0; j < numCells; ++j) {
                var cellIndex = volumeCells.getCellIndex(cells[j]);
                promises[j] = volumeCells.loadCellChildrenAt(cellIndex);
                $scope.model.masterCells.ids.push(cells[j]);
                $scope.model.masterCells.indexes.push(volumeCells.getCellIndex(cells[j]));
            }

            $q.all(promises).then(cellChildrenSuccess, cellChildrenFailure);

        }

        function cellLocationsSuccess(results) {

            if (self.verbose) {
                console.log('Cell locations loaded successfully: ');
                console.log(results);
            }

            var cellIndexes = getIndexesFromResults(results);
            var promises = [];

            console.log(cellIndexes);
            // Load cell children that the user asked for.
            for (var i = 0; i < cellIndexes.length; ++i) {
                promises.push(volumeCells.loadCellChildPartnersAt(cellIndexes[i]));
            }

            $q.all(promises).then(cellChildrenEdgesSuccess, cellChildrenEdgesFailure);
        }

        function cellLocationsFailure(results) {
            alert('cellLocationsFailures' + results);
        }

        function cellNeighborsFailure(results) {
            alert('cellNeighborsFailure' + results);
        }

        function cellNeighborsSuccess(results) {
            if (self.verbose) {
                console.log('Cell neighbors loaded successfully:');
                console.log(results);
            }

            cellsFinished();
        }

        function cellsFinished() {
            // Finished loading.
            $scope.model.cellsLoading = false;
            $scope.model.cellsLoaded = true;

            // All cells are selected by default.
            $scope.model.ui.selectedCells = angular.copy($scope.model.masterCells);
            $scope.model.cells = angular.copy($scope.model.masterCells);
            $scope.broadcastChange();
        }

        function getIndexesFromResults(results) {
            var indexes = [];
            for (var i = 0; i < results.length; ++i) {
                for (var j = 0; j < results[i].validIndexes.length; ++j) {
                    indexes.push(results[i].validIndexes[j]);
                }
            }
            return indexes;
        }

    }

})();

(function () {
    'use strict';

    angular.module('app.csvUpload')
        .controller('ExampleController', ExampleController);

    // Order here has to match the parameters of the ExampleController function.
    ExampleController.$inject = ['$scope', '$q', '$log', 'volumeOData', 'volumeBounds', 'volumeLayers', 'volumeCells', 'volumeStructures'];

    function ExampleController($scope, $q, $log, volumeOData, volumeBounds, volumeLayers, volumeCells, volumeStructures) {
        var self = this;
        self.verbose = true;
        self.dumpVolumeCells = false;

        // $scope.model is shared between different instances of this controller. It gets initialized when the
        // application starts. References to $scope.model are copied to other instances of the controller.
        $scope.model = $scope.model || {
                // variables controlled by ui elements.
                ui: {
                    allCellsChecked: true,
                    units: 'nm',
                    selectedCells: [],
                    selectedChildTypes: ["Gap Junction", "Unknown"],
                    selectedChildAttribute: 'Distance from center',
                    allNeighborLabelsChecked: true,
                    neighborLabels: [],
                    selectedNeighborLabels: [],
                    neighborGroups: [],
                    selectedNeighborGroups: [],
                    useNeighborGroups: false
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
                cellsLoadError: false,
                cellsLoadErrorMessage: '',
                isActivated: false,
                usingRemote: true
            };

        // Set this to false for loading local json of cell data.
        $scope.model.usingRemote = false;

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

                if (!$scope.model.usingRemote) {
                    $scope.loadCells([6115]);
                }
            }

        };

        /**
         * @name $scope.broadcastChange
         * @desc tell all of the views listening for 'cellsChanged' that the ui has changed in some way.
         */
        $scope.broadcastChange = function () {

            $log.debug('scope - broadcast change');

            var selectedTargets;
            var useOnlySelectedTargets;

            // TODO: Fix this when we add support for all neighbor groups
            if ($scope.model.ui.useNeighborGroups) {
                selectedTargets = $scope.model.ui.selectedNeighborGroups;
                //useOnlySelectedTargets = $scope.model.ui.allNeighborGroupsChecked;
            } else {
                selectedTargets = $scope.model.ui.selectedNeighborLabels;
                useOnlySelectedTargets = $scope.model.ui.allNeighborLabelsChecked;
            }

            $scope.$broadcast('cellsChanged',
                $scope.model.cells,
                $scope.model.childType,
                $scope.model.ui.useNeighborGroups,
                useOnlySelectedTargets,
                selectedTargets,
                $scope.model.ui.units == 'nm',
                $scope.model.ui.selectedChildAttribute == 'Diameter');
        };

        /**
         * @name $scope.getCurrentlySelectedCellIndexes
         * @returns List of cellIndexes that the user has selected accounting for the allCellsChecked option.
         */
        $scope.getCurrentlySelectedCellIndexes = function () {

            $log.debug('scope - getCurrentlySelectedCellIndexes');

            if ($scope.model.ui.allCellsChecked) {

                return $scope.model.masterCells.indexes;

            } else {

                var selectedIndexes = [];
                $scope.model.ui.selectedCells.forEach(function (cellId) {
                    selectedIndexes.push(volumeCells.getCellIndex(cellId));
                });

                return selectedIndexes;

            }
        };

        /**
         * @name $scope.loadCells
         * @desc Starts a sequence of callbacks for loading cells.
         * @param cells - list of positive integers (cell ids) that will be requested.
         */
        $scope.loadCells = function (cells) {

            $scope.model.cellsLoading = true;
            $scope.model.cellsLoaded = false;

            if ($scope.model.usingRemote) {

                volumeCells.reset();
                volumeCells.loadCellIds(cells).then(cellsLoadedSuccess, cellsLoadedFailure);

            } else {

                volumeCells.loadFromFile('../tests/mock/volumeCells.three.json').then(cellsFinished);
                $scope.model.masterCells.indexes.push(0);
                $scope.model.masterCells.indexes.push(1);
                $scope.model.masterCells.indexes.push(2);
                $scope.model.masterCells.ids.push(307);
                $scope.model.masterCells.ids.push(6115);
                $scope.model.masterCells.ids.push(6117);

            }
        };

        /**
         * @name $scope.saveCellNeighborsAsCsv
         * @desc XXX - untested
         */
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

        /**
         * @name $scope.saveCurrentCellChildrenData
         * @desc XXX - untested
         */
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

        /**
         * @name $scope.selectedChildTypesChanged
         * @desc called when user changes the child types they'd like to view. This will change the available
         *      neighbor labels, selected neighbor labels (removing those no longer reachable) then broadcast
         *      the change.
         */
        $scope.selectedChildTypesChanged = function () {
            var childTypes = [];

            for (var i = 0; i < $scope.model.ui.selectedChildTypes.length; ++i) {

                var name = $scope.model.ui.selectedChildTypes[i];
                var index = $scope.model.masterChildTypes.names.indexOf(name);
                var childType = $scope.model.masterChildTypes.ids[index];

                childTypes.push(childType);
            }

            $scope.model.childType = childTypes;

            var cellIndexes = $scope.getCurrentlySelectedCellIndexes();

            $scope.updateAvailableNeighborLabels(cellIndexes, $scope.model.childType);

            $scope.broadcastChange();
        };

        /**
         * @name $scope.selectedCellsChanged
         * @desc Updates $scope.model.cells.* to use what the user has selected. Then broadcasts the change.
         */
        $scope.selectedCellsChanged = function () {
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

        /**
         * @name $scope.selectedNeighborLabelsChanged
         * @desc broadcasts change of selection to all views.
         */
        $scope.selectedNeighborLabelsChanged = function () {
            $scope.broadcastChange();
        };

        /**
         * @name $scope.unitsChanged
         * @desc Broadcasts selected units to all views.
         */
        $scope.unitsChanged = function () {
            $scope.broadcastChange();
        };

        /**
         * @name $scope.updateAvailableNeighborLabelsFromNames
         * @param cellIndexes List of currently selected cell indexes
         * @param childTypeNames List of currently selected child types in string form
         * @desc converts childTypeNames to List of codes then calls updateAvailableNeighborLabels. This does NOT
         *      broadcast changes to views.
         */
        $scope.updateAvailableNeighborLabelsFromNames = function (cellIndexes, childTypeNames) {

            $log.debug('scope - updateAvailableNeighborLabelsFromNames', cellIndexes, childTypeNames);

            var childTypes = volumeStructures.getChildStructureIdsFromNames(childTypeNames);

            return $scope.updateAvailableNeighborLabels(cellIndexes, childTypes);

        };

        /**
         * @name $scope.updateAvailableNeighborLabelsFromNames
         * @param cellIndexes List of currently selected cell indexes
         * @param childTypes List of currently selected child types as integers
         * @desc updates $scope.model.ui.neighborLabels to show the labels that are reachable from cellIndexes
         *      by childType. When user removes a childType, this will update the selected labels to show only the
         *      labels currently reachable.
         */
        $scope.updateAvailableNeighborLabels = function (cellIndexes, childTypes) {

            $log.debug('scope - updateAvailableNeighborLabels', cellIndexes, childTypes);

            var allLabels = [];

            cellIndexes.forEach(function (cellIndex) {

                var results = volumeCells.getCellNeighborLabelsByChildType(cellIndex, childTypes);

                results.forEach(function (result) {

                    var label = result.label;

                    if (allLabels.indexOf(label) == -1) {
                        allLabels.push(label);
                    }

                });

            });

            if (allLabels.length == 0) {

                $scope.model.ui.selectedNeighborLabels = [];

            } else {

                $scope.model.ui.selectedNeighborLabels.forEach(function (selectedLabel, i) {

                    if (allLabels.indexOf(selectedLabel) == -1) {

                        $scope.model.ui.selectedNeighborLabels.splice(i, 1);

                    }

                });

            }

            $log.debug(' setting all neighbor labels to: ', allLabels);
            $scope.model.ui.neighborLabels = allLabels;
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
            $scope.model.cellsLoadErrorMessage = "The following cells could not be loaded:" + $scope.model.invalidIds;
            $scope.model.cellsLoadError = true;
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

            $scope.updateAvailableNeighborLabelsFromNames($scope.model.masterCells.indexes, $scope.model.ui.selectedChildTypes);

            if(self.dumpVolumeCells) {
                volumeCells.saveAsFile('volumeCells.json');
            }

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

(function () {
    'use strict';

    angular.module('app.csvUpload')
        .controller('ExampleController', ExampleController);

    // Order here has to match the parameters of the ExampleController function.
    ExampleController.$inject = ['$scope', '$q', '$log', 'volumeOData', 'volumeBounds', 'volumeLayers', 'volumeCells', 'volumeStructures', 'toastr'];

    function ExampleController($scope, $q, $log, volumeOData, volumeBounds, volumeLayers, volumeCells, volumeStructures, toastr) {
        var self = this;
        self.verbose = false;
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
                    useNeighborGroups: false,

                    // TODO: These fields are accessed by directives without explicit communication from controller.
                    // They should be refactored. This is accessed by neighborTableCell.html - it is used to show/hide
                    // the svg that contains the bar encoding.
                    useBarsInTable: true,

                    // TODO: This should be specific to each directive...
                    details: {
                        cellId: -1,
                        targetLabel: ''
                    },

                    availableModes: [
                        {
                            name: 'Children By Type',
                            value: 1
                        },
                        {
                            name: 'Children By Target Label',
                            value: 0
                        }
                    ],


                    selectedMode: {},
                    exportingSvgs: false,

                    availableVolumes: [ 
                        "https://websvc.codepharm.net/RC1/OData/",
                        "https://websvc.codepharm.net/RC2/OData/",
                        "https://websvc.codepharm.net/RPC1/OData/",
                        "https://websvc.codepharm.net/RPC2/OData/",
                        "https://webdev.codepharm.net/RC1Test/OData"
                    ],
                    selectedVolume: "http://websvc.codepharm.net/RC1/OData/" 
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
        // $scope.model.usingRemote = false;
        $scope.model.ui.selectedMode = $scope.model.ui.availableModes[0];

        /**
         * @name $scope.broadcastChange
         * @desc tell all of the views listening for 'cellsChanged' that the ui has changed in some way.
         */
        $scope.broadcastChange = function () {
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
                $scope.model.ui.selectedChildAttribute == 'Diameter',
                $scope.model.masterCells);
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

            if ($scope.model.usingRemote) {
                var cellsToLoad = [];
                var cellsAlreadyLoaded = [];

                // User entered list of cell IDs stored in cells.
                // Check that they haven't already been loaded. VolumeCells will not do check this for us.
                for (var i = 0; i < cells.length; ++i) {
                    var cellId = cells[i];
                    if (!volumeCells.isCellCompletelyLoaded(cellId)) {

                        // Check that the user didn't ask for duplicate cell ids.
                        if (cellsToLoad.indexOf(cellId) == -1) {
                            cellsToLoad.push(cellId);
                        } else {
                            toastr.warning('I will still try to load this id:' + cellId + '!', 'You asked for the same cell ID twice.');
                        }

                    } else {
                        cellsAlreadyLoaded.push(cellId);
                    }
                }

                if (cellsAlreadyLoaded.length > 0) {
                    toastr.warning('I\'ve already loaded cell(s):' + cellsAlreadyLoaded, 'Cells already loaded!');
                }

                if (cellsToLoad.length > 0) {
                    $scope.model.cellsLoading = true;
                    $scope.model.cellsLoaded = false;

                    $scope.loadingCellToast = toastr.success(cellsToLoad, 'I\'m loading these cell ids!');

                    // Send the list of cell ids that are about to be loaded to the 'loadedCells' directive.
                    $scope.$broadcast('onLoadingCellsStarted', cellsToLoad);

                    volumeCells.loadCellIds(cellsToLoad).then(cellsLoadedSuccess, cellsLoadedFailure);
                }

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
         * @name $scope.onExportSvgsClicked
         * @desc Runs the svg export or clean up script. (This is stolen from NY times svg-crowbar.
         */
        $scope.onExportSvgsClicked = function (exporting) {
            $scope.model.ui.exportingSvgs = !exporting;
            if ($scope.model.ui.exportingSvgs) {
                SvgExport.export();
            } else {
                SvgExport.cleanup();
            }
        };

        $scope.saveData = function (data) {
            var blob = new Blob([data], {type: "text"});
            saveAs(blob, 'data.csv');
        };

        /**
         * @name $scope.selectedChildTypesChanged
         * @desc called when user changes the child types they'd like to view. This will change the available neighbor labels, selected neighbor labels (removing those no longer reachable) then broadcast
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
         * @name $scope.selectedCellsChanged
         * @desc Updates $scope.model.cells.* to use what the user has selected. Then broadcasts the change.
         */
        $scope.selectedModeChanged = function () {

            $scope.model.ui.usingChildrenByTargetLabel = ($scope.model.ui.selectedMode.value == 0);

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

            if (self.verbose) {
                $log.debug('scope - updateAvailableNeighborLabels', cellIndexes, childTypes);
            }

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

            $scope.model.ui.neighborLabels = allLabels;
        };

        $scope.updateVolume = function (volumeUri) {
            $scope.model.masterCells = {
                ids: [],
                indexes: []
            };

            $scope.model.masterChildTypes = {
                ids: [],
                names: []
            };

            // cells that were requested but not loaded
            $scope.model.invalidIds = [];

            // cells and childType are what the user has currently selected
            $scope.model.cells = {ids: [], indexes: []};
            $scope.model.childType = [28, 244];

            $scope.model.cellsLoading = false;
            $scope.model.cellsLoaded = false;
            $scope.model.cellsLoadError = false;
            $scope.model.cellsLoadErrorMessage = '';
            $scope.model.isActivated = false;
            $scope.$broadcast('reset');
            volumeCells.reset();
            volumeStructures.reset();
            volumeLayers.reset();

            volumeOData.setVolumeUri(volumeUri);
            volumeLayers.activate().then(function () {
                activate();
            });
        };

        function activate() {

            if (!$scope.model.isActivated) {

                $scope.model.isActivated = true;

                // TODO: Error handling here.
                volumeStructures.activate(!$scope.model.usingRemote).then(parseMasterChildTypes);
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
        }

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
                $log.debug('MainCtrl - children loaded successfully: ', results);
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
                $log.debug('MainCtrl - cell children edges loaded successfully:', results);
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
            toastr.warning(results.invalidIds, 'I couldn\'t find these cell ids!');
            cellsLoadedSuccess([results]);
        }

        function cellsLoadedSuccess(results) {

            if (self.verbose) {
                $log.debug('MainCtrl - cells loaded successfully: ', results);
            }
            var validIds = [];
            var invalidIds = [];

            results.forEach(function (result) {
                validIds = validIds.concat(result.validIds);
                invalidIds = invalidIds.concat(result.invalidIds);
            });

            var promises = [];
            var cells = validIds;
            var numCells = cells.length;

            // Load cell children that the user asked for.
            for (var j = 0; j < numCells; ++j) {
                var cellIndex = volumeCells.getCellIndex(cells[j]);
                promises[j] = volumeCells.loadCellChildrenAt(cellIndex);
                $scope.model.masterCells.ids.push(cells[j]);
                $scope.model.masterCells.indexes.push(volumeCells.getCellIndex(cells[j]));
            }

            // TODO: This should be somewhere else.
            $scope.textAreaInput = "";

            var labels = [];
            cells.forEach(function (cellId) {
                labels.push(volumeCells.getCell(cellId).label);
            });
            $scope.$broadcast('onInitialCellsLoaded', cells, labels, invalidIds);

            $q.all(promises).then(cellChildrenSuccess, cellChildrenFailure);

        }

        function cellLocationsSuccess(results) {

            if (self.verbose) {
                $log.debug('MainCtrl - cell locations loaded successfully: ', results);
            }

            var cellIndexes = getIndexesFromResults(results);
            var promises = [];

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
                $log.debug('MainCtrl - cell neighbors loaded successfully:', results);
            }

            toastr.clear($scope.loadingCellToast);

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

            if (self.dumpVolumeCells) {
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

        $scope.updateVolume($scope.model.ui.selectedVolume);
    }

})();

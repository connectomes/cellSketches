(function () {
    'use strict';

    angular.module('app.helloWorld')
        .controller('ExampleController', ExampleController);

    // Order here has to match the parameters of the ExampleController function.
    ExampleController.$inject = ['$scope', '$q', 'volumeOData', 'volumeBounds', 'volumeLayers', 'volumeCells', 'volumeStructures'];

    function ExampleController($scope, $q, volumeOData, volumeBounds, volumeLayers, volumeCells, volumeStructures) {

        // Member variables
        var self = this;
        self.isActivated = false;

        var startsWithStr = 'CBb4w';

        $scope.selection = [];
        $scope.details = "";
        $scope.useSecondaryCells = false;
        // Functions
        function activate() {

            var promises = [];

            //promises[0] = volumeLayers.activate();
            //promises[1] = volumeBounds.activate();
            //promises.push(volumeStructures.activate());

            self.isActivated = true;

            return $q.all(promises);
        }

        function checkLoadedCells() {
            var loadedCells = volumeCells.getLoadedCellIds();

            for (var i = 0; i < loadedCells.length; ++i) {
                for (var j = i + 1; j < loadedCells.length; ++j) {
                    if (loadedCells[i] == loadedCells[j]) {
                        throw('Found duplicate cell ids loaded: ' + loadedCells[j] + ', ' + loadedCells[i]);
                    }
                }
            }

            var numCells = volumeCells.getNumCells();
            var foundAllNeighbors = true;
            var foundAllChildLocations = true;

            for (i = 0; i < numCells; ++i) {
                var currCell = volumeCells.getCellAt(i);
                //if (!currCell.label.startsWith(startsWithStr)) {
                  //  continue;
                //}

                if(!(currCell.id == 6117)) {
                    continue;
                }
                var numChildren = volumeCells.getNumCellChildrenAt(i);
                for (j = 0; j < numChildren; ++j) {
                    var partner = volumeCells.getCellChildPartnerAt(i, j);
                    if (partner.parentId != -1) {


                        var partnerIndex = volumeCells.getCellIndex(partner.parentId);

                        if (!(partnerIndex > -1)) {
                            console.log('No partner for cell index: ' + i);
                            console.log('No partner for child index: ' + j);
                            console.log(partner);
                            console.log(volumeCells.getCellChildAt(i, j));
                        }

                        foundAllNeighbors = foundAllNeighbors && (partnerIndex > -1);
                    }
                    var locations = volumeCells.getCellChildLocationsAt(i, j);
                    if (!(locations.length > 0)) {
                        console.log(volumeCells.getCellChildAt(i, j));
                        console.log('No locations for cell index: ' + i);
                        console.log('No locations for child index: ' + j);
                    }

                    foundAllChildLocations = foundAllChildLocations && (locations.length > 0);

                }
            }

            console.log('Found all neighbors? ' + (foundAllNeighbors ? 'yes' : 'no' ));
            console.log('Found all child locations? ' + (foundAllChildLocations ? 'yes' : 'no' ));
            console.log('Success!');

        }

        $scope.createSetsFromLoadedCells = function() {
            return;
            console.log('hello');
            var label = 'CBb3+';
            $scope.cells = [];
            $scope.secondaryCells = [];
            console.log($scope.useSecondaryCells);

            $scope.childType = 28;
            //$scope.childType = undefined;
            $scope.cells.push({
                name: label,
                indexes: volumeCells.getCellIndexesInLabelRegExp(new RegExp('CBb4w'))
            });

            $scope.secondaryCells = [];

            $scope.secondaryCells.push({
                name: "CBb+",
                indexes: volumeCells.getCellIndexesInLabelRegExp(new RegExp('CBb+'))
            });

            $scope.secondaryCells.push({
                name: '^AC',
                indexes: volumeCells.getCellIndexesInLabelRegExp(new RegExp('^AC'))
            });

            $scope.secondaryCells.push({
                name: 'GC ON',
                indexes: volumeCells.getCellIndexesInLabelRegExp(new RegExp('GC ON'))
            });

            $scope.secondaryCells.push({
                name: 'CBx',
                indexes: volumeCells.getCellIndexesInLabelRegExp(new RegExp('CBx'))
            });

            $scope.secondaryCells.push({
                name: 'null',
                indexes: volumeCells.getCellIndexesInLabelRegExp(new RegExp('null'))
            });

            $scope.$broadcast('cellsChanged', $scope.cells, $scope.childType, $scope.useSecondaryCells, $scope.secondaryCells);
        };

        function loadLocal() {

            $scope.rangeVolumeX = volumeBounds.getRangeVolumeX();
            $scope.rangeVolumeY = volumeBounds.getRangeVolumeY();
            $scope.cells = [];

            var filename = '../tests/mock/volumeCells.6117.json';

            volumeCells.loadFromFile(filename).then(function () {
                checkLoadedCells();
                $scope.createSetsFromLoadedCells();
            });
        }

        function loadRemoteStartsWith() {
            $scope.rangeVolumeX = volumeBounds.getRangeVolumeX();
            $scope.rangeVolumeY = volumeBounds.getRangeVolumeY();
            $scope.details = [];

            //volumeCells.loadCellStartsWith(startsWithStr).then(function () {
            volumeCells.loadCellId(6117).then(function() {

                var promises = [];
                var numCells = volumeCells.getNumCells();

                for (var i = 0; i < numCells; ++i) {
                    promises[i] = volumeCells.loadCellChildrenAt(i);
                }

                $q.all(promises).then(function () {

                    promises = [];

                    for (var i = 0; i < numCells; ++i) {
                        promises.push(volumeCells.loadCellNeighborsAt(i));
                        promises.push(volumeCells.loadCellLocationsAt(i));
                    }

                    $q.all(promises).then(function () {
                        checkLoadedCells();
                        volumeCells.saveAsFile("volumeCells.startsWithCBb.json");
                        $scope.createSetsFromLoadedCells();

                    });
                });
            });
        }

        // Activate this.
        activate().then(loadLocal);

    }

})();

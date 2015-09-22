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

        var startsWithStr = 'CBb';

        $scope.selection = [];$scope.details = "";
        // Functions
        function activate() {

            var promises = [];

            //promises[0] = volumeLayers.activate();
            //promises[1] = volumeBounds.activate();
            promises.push(volumeStructures.activate());

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
                if (!currCell.label.startsWith(startsWithStr)) {
                    continue;
                }
                var numChildren = volumeCells.getNumCellChildrenAt(i);
                for (j = 0; j < numChildren; ++j) {
                    var partner = volumeCells.getCellChildPartnerAt(i, j);
                    if (partner.partnerParent != -1) {


                        var partnerIndex = volumeCells.getCellIndex(partner.partnerParent);

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

        function createSetsFromLoadedCells() {
            var label = 'CBb4w';
            var indexes = volumeCells.getCellIndexesInLabel(label);
            $scope.cells = [];
            $scope.cells.push({name: label, indexes: indexes});
            $scope.cells.push({name: 'candidate', indexes: [volumeCells.getCellIndex(6117)]});
            $scope.$broadcast('cellsChanged', $scope.cells);
        }

        function loadLocal() {

            $scope.rangeVolumeX = volumeBounds.getRangeVolumeX();
            $scope.rangeVolumeY = volumeBounds.getRangeVolumeY();
            $scope.cells = [];

            var filename = '../tests/mock/volumeCells.startsWithCBb.json';

            volumeCells.loadFromFile(filename).then(function () {
                checkLoadedCells();
                createSetsFromLoadedCells();
            });
        }

        function loadRemoteStartsWith() {
            $scope.rangeVolumeX = volumeBounds.getRangeVolumeX();
            $scope.rangeVolumeY = volumeBounds.getRangeVolumeY();
            $scope.details = [];

            volumeCells.loadCellStartsWith(startsWithStr).then(function () {

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
                    });
                });
            });
        }

        // Activate this.
        activate().then(loadLocal);

    }

})();

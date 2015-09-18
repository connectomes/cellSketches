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

        // Functions
        function activate() {

            var promises = [];

            promises[0] = volumeLayers.activate();
            promises[1] = volumeBounds.activate();
            promises[2] = volumeStructures.activate();

            self.isActivated = true;

            return $q.all(promises);
        }

        function checkForDuplicateCells() {
            var loadedCells = volumeCells.getLoadedCellIds();

            for(var i=0; i<loadedCells.length; ++i) {
                for(var j=i+1; j<loadedCells.length; ++j) {
                    if (loadedCells[i] == loadedCells[j]) {
                        throw('Found duplicate cell ids loaded: ' + loadedCells[j] + ', ' + loadedCells[i]);
                    }
                }
            }
            console.log('Success!');
        }

        function loadLocal() {
            var filename = 'shit.json';

            volumeCells.loadFromFile(filename).then(function() {
                checkForDuplicateCells();
            });
        }

        function loadRemoteStartsWith() {

            $scope.rangeVolumeX = volumeBounds.getRangeVolumeX();
            $scope.rangeVolumeY = volumeBounds.getRangeVolumeY();
            $scope.cells = [];
            volumeCells.loadCellStartsWith('CBb').then(function () {
                var promises = [];

                var numCells = volumeCells.getNumCells();
                for (var i = 0; i < numCells; ++i) {
                    promises[i] = volumeCells.loadCellChildrenAt(i);
                }

                $q.all(promises).then(function () {
                    console.log('finished loading children');

                    promises = [];

                    for (var i = 0; i < numCells; ++i) {
                        promises[i] = volumeCells.loadCellNeighborsAt(i);
                    }

                    $q.all(promises).then(function () {
                        console.log('finished loading cell neighbors');
                        var filename = 'volumeCells.startsWithCBb.json';
                        volumeCells.saveAsFile(filename);
                        checkForDuplicateCells();
                    });
                });

            });

        }


        function loadRemote () {

            $scope.rangeVolumeX = volumeBounds.getRangeVolumeX();
            $scope.rangeVolumeY = volumeBounds.getRangeVolumeY();
            $scope.cells = [];
            var labels = ['CBb4w', 'Rod BC', 'AC', 'Cbb5w', 'Cbb3m'];
            volumeCells.loadCellLabels(labels).then(function () {

                var cellsInLabels = [];
                for(var i=0; i<labels.length; ++i) {
                    cellsInLabels = cellsInLabels.concat(volumeCells.getCellIndexesInLabel(labels[i]));
                }

                var promises = [];

                for (i = 0; i < cellsInLabels.length; ++i) {
                    promises[i] = volumeCells.loadCellChildrenAt(cellsInLabels[i]);
                }

                $q.all(promises).then(function () {
                    console.log('finished loading children');

                    promises = [];

                    for (var i = 0; i < cellsInLabels.length; ++i) {
                        promises[i] = volumeCells.loadCellNeighborsAt(cellsInLabels[i]);
                    }

                    $q.all(promises).then(function () {
                        console.log('finished loading cell neighbors');
                        var filename = 'shit.json';
                        volumeCells.saveAsFile(filename);
                        checkForDuplicateCells();
                    });
                });

            });

        }

        // Activate this.
        activate().then(loadRemoteStartsWith);

    }

})();

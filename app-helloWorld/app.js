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


        function loadLocal() {
            var filename = 'shit.json';
            volumeCells.loadFromFile(filename);
        }
        function loadRemote() {

            $scope.rangeVolumeX = volumeBounds.getRangeVolumeX();
            $scope.rangeVolumeY = volumeBounds.getRangeVolumeY();
            $scope.cells = [];
            //var label = 'CBb4w';
            var label = 'Rod BC';
            volumeCells.loadCellLabel(label).then(function () {

                var cellsInLabel = volumeCells.getCellIndexesInLabel(label);

                var promises = [];

                for (var i = 0; i < cellsInLabel.length; ++i) {
                    promises[i] = volumeCells.loadCellChildrenAt(cellsInLabel[i]);
                }

                $q.all(promises).then(function () {
                    console.log('finished loading children');

                    promises = [];

                    for (var i = 0; i < cellsInLabel.length; ++i) {
                        promises[i] = volumeCells.loadCellNeighborsAt(cellsInLabel[i]);
                    }

                    $q.all(promises).then(function () {
                        console.log('finished loading cell neighbors');
                        var filename = 'shit.json';
                        volumeCells.saveAsFile(filename);

                        //filename = '../tests/mock/shit.json';

                        for (var i = 0; i < cellsInLabel.length; ++i) {
                            console.log(volumeCells.getCellNeighborLabelsByChildType(i));
                        }
                    });
                });

            });

        }


        // Activate this.
        activate().then(loadLocal);

    }

})();

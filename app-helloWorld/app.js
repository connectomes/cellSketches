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

        function updateScopeData() {

            $scope.rangeVolumeX = volumeBounds.getRangeVolumeX();
            $scope.rangeVolumeY = volumeBounds.getRangeVolumeY();
            $scope.cells = [];
            volumeCells.loadCellId(6117).then(function () {
                volumeCells.loadCellChildren(6117).then(function() {
                    volumeCells.loadCellNeighbors(6117).then(function() {
                        var neighbors = volumeCells.getCellNeighborIndexesByChildType(0);
                        for(var i=0; i<neighbors.length; ++i) {
                            $scope.cells.push(volumeCells.getCellAt(neighbors[i]));
                        }
                        console.log("Done!");
                    });
                });
            });
        }

        // Activate this.
        activate().then(updateScopeData);

    }

})();

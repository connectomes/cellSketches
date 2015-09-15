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


             volumeCells.loadCellId(6117).then(function() {
                 volumeCells.loadCellChildren(6117).then(function() {
                    $scope.cells = volumeCells.getCell(6117);
                });
             });


        }

        // Activate this.
        activate().then(updateScopeData);

    }

})();

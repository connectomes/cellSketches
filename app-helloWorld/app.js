(function () {
    'use strict';

    angular.module('app.helloWorld')
        .controller('ExampleController', ExampleController);

    // Order here has to match the parameters of the ExampleController function.
    ExampleController.$inject = ['$scope', '$q', 'volumeOData', 'volumeBounds', 'volumeLayers', 'volumeCells'];

    function ExampleController($scope, $q, volumeOData, volumeBounds, volumeLayers, volumeCells) {

        var self = this;

        self.isActivated = false;

        function activate() {

            var promises = [];
            promises[0] = volumeLayers.activate();
            promises[1] = volumeBounds.activate();

            return $q.all(promises);
        }

        function updateScopeData() {
            $scope.rangeVolumeX = volumeBounds.getRangeVolumeX();
            $scope.rangeVolumeY = volumeBounds.getRangeVolumeY();
        }

        activate().then(updateScopeData);
    }

})();

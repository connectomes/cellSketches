/**
 * Copyright (c) Ethan Kerzner 2015
 */

var myApp = angular.module('formExample', []);

myApp.controller('ExampleController', function ($scope, $q, volumeOData, volumeBounds, volumeLayers, volumeCells) {

    var self = this;

    self.isActivated = false;

    function activate() {

        var promises = [];

        promises[0] = volumeLayers.activate();
        promises[1] = volumeBounds.activate();

        return $q.all(promises);
    }

    $scope.master = {};

    $scope.cell = {
        input: 6117,
        inputLabel: 'CBb4w'
    };

    $scope.cellAdded = function (cell) {
        console.log('cellAdded:', cell.input);
        var newCell = cell.input;
        cell.input = "";

        function success() {
            console.log("Success!");
            console.log('cells finished loading');
            console.log(volumeCells.getLoadedCellIds());
            $scope.$broadcast('loadedCellsChanged', cell);
        }

        function error(error) {
            alert(error);
        }

        if (!self.isActivated) {
            activate().then(function () {
                volumeCells.loadCellId(newCell).then(success, error)
            });
        } else {
            volumeCells.loadCellId(newCell).then(success, error)
        }

    };

    $scope.cellLabelAdded = function (cell) {

        function loadCellLabel() {
            console.log("start cell label add: " + cell.inputLabel);
            volumeCells.loadCellLabel(cell.inputLabel).then(function () {
                console.log("Finished loading cell labels");
                $scope.$broadcast('loadedCellsChanged', cell);
            });
        }

        if (!self.isActivated) {
            activate().then(loadCellLabel());
        } else {
            loadCellLabel();
        }
    };

    $scope.cellRemoved = function (cell) {
        console.log('Cell removed!');
        volumeCells.removeCellId(cell);
        $scope.$broadcast('loadedCellsChanged');
    };

    $scope.reset = function () {
        $scope.cell = angular.copy($scope.master);
    };

    $scope.$watch('cell.radius', function (oldValue, newValue) {
        volumeLayers.setSearchRadius(newValue);
        $scope.$broadcast('radiusChanged');
    });
});
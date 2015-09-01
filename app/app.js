/**
 * Copyright (c) Ethan Kerzner 2015
 */

var myApp = angular.module('formExample', []);

myApp.controller('ExampleController', function ($scope, $q, volumeOData, volumeBounds, volumeLayers, volumeCells) {

    var self = this;

    activate();

    function activate() {

        function success(result) {
            volumeLayers.activate().then(null, error);
        }

        function error(error) {
            alert(error);
        }

        volumeBounds.activate().then(success, error);
    }

    $scope.master = {};

    $scope.cellAdded = function(cell) {
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

        volumeCells.loadCellId(newCell).then(success, error);
    };

    $scope.reset = function () {
        $scope.cell = angular.copy($scope.master);
    };

    $scope.$watch('cell.radius', function(oldValue, newValue) {
        volumeLayers.setSearchRadius(newValue);
        $scope.$broadcast('radiusChanged');
    });
});
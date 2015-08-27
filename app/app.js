/**
 * Copyright (c) Ethan Kerzner 2015
 */

var myApp = angular.module('formExample', []);

myApp.controller('ExampleController', function ($scope, $q, volumeOData, volumeBounds, volumeLayers, volumeCells) {

    var self = this;

    volumeBounds.activate().then(function () {
        volumeLayers.activate().then(function() {
            $scope.update({name:[6117, 519]});
        });
    });

    $scope.master = {};

    $scope.master.name = [6117, 519];

    $scope.update = function(cell) {
        console.log('scope update');
        $scope.cell = angular.copy(cell);
        var promises = [];
        for(var i=0; i<cell.name.length; ++i) {
            promises[i] = volumeCells.loadCellId(cell.name[i]);
        }
        $q.all(promises).then(function() {
                $scope.$broadcast('loadedCellsChanged', cell);
        });
    };

    $scope.reset = function () {
        $scope.cell = angular.copy($scope.master);
    };

    $scope.$watch('cell.radius', function(oldValue, newValue) {
        volumeLayers.setSearchRadius(newValue);
        $scope.$broadcast('radiusChanged');
    });
});
/**
 * Copyright (c) Ethan Kerzner 2015
 */

var myApp = angular.module('formExample', []);

myApp.controller('ExampleController', function ($scope, volumeOData, volumeBounds, volumeLayers) {

    var self = this;

    volumeBounds.activate().then(function () {
        volumeLayers.activate().then(function() {
            $scope.reset();
        });
    });

    $scope.master = {};

    $scope.master.name = 6117;

    $scope.update = function(cell) {
        $scope.cell = angular.copy(cell);
    };

    $scope.reset = function () {
        $scope.cell = angular.copy($scope.master);
    };
});
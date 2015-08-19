/**
 * Copyright (c) Ethan Kerzner 2015
 */
var myApp = angular.module('formExample', []);

myApp.controller('ExampleController', function ($scope, volumeOData, volumeBounds, volumeLayers) {

    var self = this;

    volumeBounds.init().then(function () {
        volumeLayers.init().then(function () {
            $scope.master.name = 6117;
            $scope.reset();
        });
    });

    $scope.childStructureCount = null;

    $scope.childDepthCount = null;

    $scope.depthCount = null;

    $scope.locations = {};

    $scope.locationMap = {};

    $scope.master = {};

    $scope.results = {};

    $scope.structureMap = d3.map();

    $scope.reset = function () {
        $scope.cell = angular.copy($scope.master);
        vol
    };
});
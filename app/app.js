var myApp = angular.module('formExample', []);

myApp.controller('ExampleController', ['$scope', function ($scope) {

    $scope.master = {};
    $scope.master.name = 6117;
    $scope.results = {};
    $scope.childStructureCount = null;
    $scope.locations = {};
    $scope.locationMap = {};
    $scope.structureMap = getStructureMap();

    $scope.update = function (cell) {
        // Build request for cell
        $scope.master = angular.copy(cell);
        requestURL = serviceURL + "Structures(" + cell.name + "L)\\Children";

        // Try to read. Alert angular of updates to scope.
        OData.read(requestURL, function (data) {

            $scope.$apply(function () {
                $scope.results = angular.copy(data);
            });


            var childStructureCount = d3.map();
            for (var i = 0; i < data.results.length; i++) {
                var currName = $scope.structureMap.get(data.results[i].TypeID);
                if (childStructureCount.has(currName)) {
                    var currValue = childStructureCount.get(currName);
                    childStructureCount.set(currName, currValue + 1);
                } else {
                    childStructureCount.set(currName, 1);
                }
            }

            $scope.$apply(function () {
                $scope.childStructureCount = childStructureCount;
            });

        }, function (err) {
            $scope.$apply(function () {
                $scope.results = err;
            });
        });

        requestURL = serviceURL + "Structures(" + cell.name + "L)\\Locations";
        OData.read(requestURL, function (data) {

            $scope.$apply(function () {
                $scope.locations = angular.copy(data);
            });


            var depthCount = d3.map();
            for (var i = 0; i < data.results.length; i++) {
                var currDepth = data.results[i].Z;
                if (depthCount.has(currDepth)) {
                    var currValue = depthCount.get(currDepth);
                    currValue.push(i);
                    depthCount.set(currDepth, currValue);
                } else {
                    var array = [];
                    array[0] = i;
                    depthCount.set(currDepth, array);
                }
            }

            $scope.$apply(function () {
                $scope.depthCount = depthCount;
            });
        });

    };

    $scope.reset = function () {
        $scope.cell = angular.copy($scope.master);
    };

    $scope.reset();
}]);


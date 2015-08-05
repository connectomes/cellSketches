var myApp = angular.module('formExample', []);

myApp.controller('ExampleController', ['$scope', function ($scope) {

    var self = this;

    /* Self variables */

    self.serviceURL = "http://websvc1.connectomes.utah.edu/RC1/OData/ConnectomeData.svc/";
    OData.defaultHttpClient.enableJsonpCallback = true;

    /* Scope variables */

    $scope.childStructureCount = null;

    $scope.childDepthCount = null;

    $scope.depthCount = null;

    $scope.locations = {};

    $scope.locationMap = {};

    $scope.master = {};

    $scope.master.name = 6117;

    $scope.results = {};

    $scope.structureMap = null;



    /* Self functions */

    self.queryStructureMap = function () {
        var requestURL = self.serviceURL + "StructureTypes";
        var structureMap = d3.map();
        self.queryData(requestURL, function (data) {
            for (var i = 0; i < data.results.length; i++) {
                var currName = data.results[i].Name;
                var currValue = data.results[i].ID;
                structureMap.set(currValue, currName);
            }
            $scope.structureMap = structureMap;
        });
    };

    self.queryData = function (requestURL, callback) {
        OData.read(requestURL, callback, function (err) {
            console.log("Warning - query failed " + err);
        });
    };

    /* Scope functions */

    $scope.update = function (cell) {

        // Build request for cell
        $scope.master = angular.copy(cell);
        var requestURL = self.serviceURL + "Structures(" + cell.name + "L)\\Children";

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

        requestURL = self.serviceURL + "Structures(" + cell.name + "L)\\Locations";
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

        requestURL = self.serviceURL + "Structures?$filter=ParentID eq " + cell.name + "&$expand=Locations&$select=Locations/Z,Locations/ParentID,TypeID,ID";
        OData.read(requestURL, function (data) {
            console.log(data);
            var childStructureIDs = [];

            // Find the types of child structures that are present
            for (var i = 0; i < data.results.length; ++i) {
                var currChild = data.results[i];
                var currTypeID = currChild.TypeID;
                if (childStructureIDs.indexOf(currTypeID) == -1) {
                    childStructureIDs.push(currTypeID);
                }
            }

            var childDepthCounts = d3.map();

            // For each structure ID...
            for (i = 0; i < childStructureIDs.length; ++i) {
                var currTypeID = childStructureIDs[i];
                var currMap = d3.map();

                // For each result item...
                for (var j = 0; j < data.results.length; ++j) {
                    var currChild = data.results[j];

                    if (currChild.TypeID == currTypeID) {
                        var currLocations = currChild.Locations.results;

                        for (var k = 0; k < currLocations.length; ++k) {
                            var currLocation = currLocations[k];
                            var currDepth = currLocation.Z;

                            if (currMap.has(currDepth)) {
                                var currValue = currMap.get(currDepth);
                                currValue.push(j);
                                currMap.set(currDepth, currValue);
                            } else {
                                var array = [];
                                array[0] = j;
                                currMap.set(currDepth, array);
                            }
                        }
                    }
                }
                childDepthCounts.set(currTypeID, currMap);
            }

            $scope.$apply(function () {
                $scope.childDepthCount = childDepthCounts;
            });

        }, function (err) {
            console.log(err);
        });
    };

    $scope.reset = function () {
        $scope.cell = angular.copy($scope.master);
    };

    /* Initialization stuff */

    $scope.reset();

    self.queryStructureMap();
}]);


(function () {
    'use strict';

    angular
        .module('app.volumeModule')
        .factory('volumeLayers', volumeLayers);

    volumeLayers.$inject = ['$q', '$log', 'volumeOData'];

    function volumeLayers($q, $log, volumeOData) {

        var self = this;
        self.upper = [];
        self.lower = [];

        var service = {
            activate: activate,
            convertToIPLPercent: convertToIPLPercent,
            getUpperBounds: getUpperBounds,
            getLowerBounds: getLowerBounds,
            setSearchRadius: setSearchRadius
        };

        return service;

        function activate() {

            var deferred = $q.defer();

            // Requests for upper and lower boundaries of IPL.
            var requests = [];
            requests[0] = "Structures?$filter=(TypeID eq 224)&$expand=Locations";
            requests[1] = "Structures?$filter=(TypeID eq 235)&$expand=Locations";

            var parseResults = function (promises) {

                for (var i = 0; i < promises.length; ++i) {

                    var locations = promises[i].data.value[0].Locations;

                    for (var j = 0; j < locations.length; ++j) {

                        var currLocation = locations[j];
                        var location = {
                            position: new utils.Point3D(currLocation.VolumeY, currLocation.VolumeX, currLocation.Z),
                            id: locations[j].ID
                        };

                        if (i == 0) {
                            self.upper.push(location);
                        } else if (i == 1) {
                            self.lower.push(location);
                        }
                    }
                }
                deferred.resolve();
            };

            volumeOData.requestMulti(requests)
                .then(parseResults);

            self.searchRadius = 15000;

            return deferred.promise;
        }

        function convertToIPLPercent(point, useOnlyTopMarkers) {

            var inputPoint = point.getAs2D();

            // Same indexes used throughout this method.
            // nearestIdxs[0] = index of nearest neighbor on bottom of layer.
            // nearestIdxs[1] = index of nearest neighbor on top of layer.
            var nearestIndexes = [];
            var nearestDistances = [];
            var pointsInRadiusIdxs = [[], []];
            var distancesInRadius = [[], []];

            // Initialize upper and lower nearest neighbor points.
            var boundaries = [self.lower, self.upper];
            for (var i = 0; i < boundaries.length; ++i) {
                var currBoundary = boundaries[i];
                var current = currBoundary[0].position.getAs2D();
                nearestIndexes[i] = 0;
                nearestDistances[i] = current.distance(inputPoint);
            }

            // Search for nearest neighbor and points in radius.
            for (i = 0; i < boundaries.length; ++i) {
                currBoundary = boundaries[i];
                for (var j = 0; j < currBoundary.length; ++j) {
                    // TODO: use the point structure.
                    current = currBoundary[j].position.getAs2D();
                    var distance = current.distance(inputPoint);

                    // Nearest neighbor for current boundary?
                    if (distance < nearestDistances[i]) {
                        nearestDistances[i] = distance;
                        nearestIndexes[i] = j;
                    }

                    // Point in search radius?
                    if (distance < self.searchRadius) {
                        pointsInRadiusIdxs[i].push(j);
                        distancesInRadius[i].push(distance);
                    }
                }
            }

            // Compute average of depth values weighted by distance from point.
            var averageDepths = [];

            for (i = 0; i < boundaries.length; ++i) {
                currBoundary = boundaries[i];
                var currPointsInRadius = pointsInRadiusIdxs[i];
                var currDistancesInRadius = distancesInRadius[i];

                // No points in search radius -> use nearest point as our best guess.
                if (pointsInRadiusIdxs[i].length == 0) {
                    averageDepths[i] = currBoundary[nearestIndexes[i]].position.z;
                    pointsInRadiusIdxs[i].push(nearestIndexes[i]);
                } else {
                    var totalDepth = 0.0;
                    var totalDistance = 0.0;

                    for (j = 0; j < currPointsInRadius.length; ++j) {
                        var currPoint = currBoundary[currPointsInRadius[j]].position;
                        totalDepth += (currPoint.z * currDistancesInRadius[j]);
                        totalDistance += currDistancesInRadius[j];
                    }
                    averageDepths[i] = (totalDepth / totalDistance);
                }
            }

            var percent = undefined;
            if(useOnlyTopMarkers) {
                percent = (point.z - averageDepths[1]);
            } else {
                percent = (point.z - averageDepths[1]) / (averageDepths[0] - averageDepths[1]);
            }

            return {
                bottomIndexes: pointsInRadiusIdxs[0],
                topIndexes: pointsInRadiusIdxs[1],
                percent: percent
            };
        }

        function getUpperBounds() {
            return self.upper;
        }

        function getLowerBounds() {
            return self.lower;
        }

        function setSearchRadius(radius) {
            self.searchRadius = radius;
        }
    }
}());
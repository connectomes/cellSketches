/**
 * Copyright (c) Ethan Kerzner 2015
 */

(function () {
    'use strict';

    angular
        .module('formExample')
        .factory('volumeLayers', volumeLayers);

    volumeLayers.$inject = ['$q', 'volumeOData'];

    function volumeLayers($q, volumeOData) {

        var self = this;
        self.upper = [];
        self.lower = [];

        var service = {
            activate: activate,
            convertToIPLPercent: convertToIPLPercent,
            getUpperBounds: getUpperBounds,
            getLowerBounds: getLowerBounds
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

                    var locations = promises[i].results[0].Locations.results;

                    for (var j = 0; j < locations.length; ++j) {

                        var location = {
                            volumeX: locations[j].VolumeX,
                            volumeY: locations[j].VolumeY,
                            z: locations[j].Z,
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

            return deferred.promise;
        }

        function convertToIPLPercent(point) {

            // TODO: Move this when its needed somewhere else.
            function distance2D(p, q) {
                return Math.sqrt(Math.pow((p[0] - q[0]), 2) + Math.pow(p[1] - q[1], 2))
            }

            // Find closest point in upper and lower boundaries.
            var nearestUpperIdx = 0;
            var current = [self.upper[0].volumeX, self.upper[0].volumeY];
            var nearestUpperDistance = distance2D(point, current);

            var nearestLowerIdx = 0;
            current = [self.lower[0].volumeX, self.lower[0].volumeY];
            var nearestLowerDistance = distance2D(point, current);

            for (var i = 0; i < self.upper.length; ++i) {
                current = [self.upper[i].volumeX, self.upper[i].volumeY];
                var distance = distance2D(point, current);
                if (distance < nearestUpperDistance) {
                    nearestUpperIdx = i;
                    nearestUpperDistance = distance;
                }
            }

            for (i = 0; i < self.lower.length; ++i) {
                current = [self.lower[i].volumeX, self.lower[i].volumeY];
                var distance = distance2D(point, current);
                if (distance < nearestLowerDistance) {
                    nearestLowerDistance = distance;
                    nearestLowerIdx = i;
                }
            }

            // IPL percent is diff between the two.
            var percent = (point[2] - self.upper[nearestUpperIdx].z) / (self.lower[nearestLowerIdx].z - self.upper[nearestUpperIdx].z);

            return {
                bottomIdx: nearestLowerIdx,
                topIdx: nearestUpperIdx,
                percent: percent
            };
        }

        function getUpperBounds() {
            return self.upper;
        }

        function getLowerBounds() {
            return self.lower;
        }
    }
}());
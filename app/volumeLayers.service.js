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
            init: init,
            getTopBounds: getTopBounds,
            getBottomBounds: getBottomBounds
        };

        return service;

        function init() {

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
                            self.lower.push(location);
                        } else if (i == 1) {
                            self.upper.push(location);
                        }
                    }
                }
                deferred.resolve();
            };

            volumeOData.requestMulti(requests)
                .then(parseResults);

            return deferred.promise;
        }

        function getTopBounds() {
            return self.upper;
        }

        function getBottomBounds() {
            return self.lower;
        }
    }
}());
/**
 * Copyright (c) Ethan Kerzner 2015
 */

(function () {
    'use strict';

    angular
        .module('formExample')
        .factory('volumeCells', volumeCells);

    volumeCells.$inject = ['$q', 'volumeOData'];

    function volumeCells($q, volumeOData) {

        var self = this;
        self.cells = [];
        self.cellLocations = [];

        var service = {
            getCellLocations: getCellLocations,
            getLoadedCellIds: getLoadedCellIds,
            loadCellId: loadCellId
        };

        return service;

        function failure(err) {
            throw err;
        }

        function getCellLocations(id) {
            for (var i = 0; i < self.cells.length; ++i) {
                if (self.cells[i].id == id) {
                    return self.cellLocations[i];
                }
            }
            throw 'Error - tried to get locations of this cell ID, but they weren\'t loaded yet:' + id;
        }

        function getLoadedCellIds() {
            var ids = [];
            for (var i = 0; i < self.cells.length; ++i) {
                ids.push(self.cells[i].id);
            }
            return ids;
        }

        function loadCellId(id) {
            console.log("loading cell id:");
            console.log(id);

            return $q(function (resolve, reject) {

                var request = "Structures?$filter=(ID eq " + id + ")&$expand=Locations&$select=Locations/Radius,Locations/VolumeX,Locations/VolumeY,Locations/Z,ID,Locations/ID";

                function success(data) {
                    var promises = [];

                    for (var i = 0; i < data.results.length; ++i) {

                        var cell = {
                            id: data.results[i].ID,
                            locations: self.cellLocations.length
                        };

                        self.cells.push(cell);

                        var locations = [];
                        for (var j = 0; j < data.results[i].Locations.results.length; ++j) {

                            var currLocation = data.results[i].Locations.results[j];

                            var location = {
                                volumeX: currLocation.VolumeX,
                                volumeY: currLocation.VolumeY,
                                z: currLocation.Z,
                                radius: currLocation.Radius,
                                id: currLocation.ID
                            };

                            locations.push(location);
                        }

                        self.cellLocations.push(locations);

                        var nextUri = data.results[i].Locations.__next;
                        if (nextUri) {
                            throw "Error - need to implement recursive cell queries!";
                        }
                    }

                    $q.all(promises).then(function () {
                        console.log("finished loading cell id");
                        resolve();
                    });

                }

                volumeOData.request(request).then(success, failure);
            });
        }


    }

}());
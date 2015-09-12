(function () {
    'use strict';

    angular
        .module('app.volumeModule')
        .factory('volumeCells', volumeCells);

    volumeCells.$inject = ['$q', 'volumeOData'];

    function volumeCells($q, volumeOData) {

        var self = this;
        self.cells = [];
        self.cellLocations = [];

        var service = {
            getCellLocations: getCellLocations,
            getLoadedCellIds: getLoadedCellIds,
            loadCellId: loadCellId,
            loadCellLabel: loadCellLabel,
            removeCellId: removeCellId
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

                var request = "Structures?$filter=(ID eq " + id + ")&$expand=Locations($select=Radius,VolumeX,VolumeY,Z,ParentID,ID)";

                function success(data) {

                    var newCells = data.data.value;
                    if (newCells.length == 0) {
                        reject("Cell " + id + " does not exist!");
                    }

                    for (var i = 0; i < newCells.length; ++i) {
                        var currCell = newCells[i];

                        var cell = {
                            id: currCell.ID,
                            locations: self.cellLocations.length
                        };

                        self.cells.push(cell);

                        var locations = [];
                        for (var j = 0; j < currCell.Locations.length; ++j) {

                            var currLocation = currCell.Locations[j];

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
                    }
                    resolve();
                }

                volumeOData.request(request).then(success, failure);
            });
        }

        function loadCellLabel(label) {

            return $q(function (resolve, reject) {

                var request = "Structures?$filter=(Label eq + %27" + label + "%27)&$select=ID";

                function success(data) {

                    var promises = [];

                    var cellIds = data.data.value;

                    for(var i=0; i<cellIds.length; ++i)
                    {
                        promises[i] = loadCellId(cellIds[i].ID);
                    }

                    $q.all(promises).then(function() {
                        resolve();
                    });
                }

                volumeOData.request(request).then(success, failure);
            });

        }

        function removeCellId(id) {
            for (var i = 0; i < self.cells.length; ++i) {
                if (self.cells[i].id == id) {
                    self.cells.splice(i, 1);
                    self.cellLocations.splice(i, 1);
                    return;
                }
            }
            throw 'Error - tried to remove cell id that was not loaded yet:' + id;
        }

    }
}());
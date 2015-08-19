/**
 * Copyright (c) Ethan Kerzner 2015
 */

(function () {
    'use strict';

    angular
        .module('formExample')
        .factory('volumeCells', volumeCells);

    volumeCells.$inject = ['$q', 'odata'];

    function volumeCells($q, odata) {
        var self = this;
        self.cells = [];

        var service = {
            loadCellId: loadCellId
        };

        return service;

        function loadCellId(id) {
            return $q(function(resolve, reject) {

                var request = "Structures?$filter=(ID eq " + id + ")&$expand=Locations&$select=Locations/Radius,Locations/VolumeX,Locations/VolumeY,Locations/Z,ID,Locations/ID";
                console.log(request);

                function success(data) {
                    var promises = [];

                    for (var i = 0; i < data.results.length; ++i) {
                        console.log(data);
                        var cell = {
                            id: data.results[i].ID,
                            locations: self.cellLocations.length
                        };

                        // Self is the cellCache--not the promise.
                        self.cells.push(cell);
                        self.cellLocations.push(data.results[i].Locations.results);

                        var nextUri = data.results[i].Locations.__next;
                        if (nextUri) {
                            console.log("Warning need to implement recursive cell queries!");
                            reject();
                        }
                    }

                    // Only resolve after all queries have finished.
                    $q.all(promises).then(function () {
                        resolve();
                    });

                }

                odata.request(request).then(success);

            });
        }
    }

}());
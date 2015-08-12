/**
 * Copyright (c) Ethan Kerzner 2015
 */

myApp.service('cellCache', function (volumeQueries) {

    var self = this;
    self.verbose = true;
    self.cells = [];
    self.cellLocations = [];

    // TODO: Figure out something else to do with this.
    self.handleException = function (exception) {
        console.log(exception);
    };

    // Load cells of label. Returns a promise of the query status.
    self.loadCells = function (label) {

        return Q.promise(
            function (resolve, reject, notify) {
                var request = "Structures?$filter=(Label eq " + label + ")&$expand=Locations&$" +
                    "select=Locations/Radius,Locations/VolumeX,Locations/VolumeY,Locations/Z,ID,Locations/ID";

                // Shove data into the cellCache. We have a try catch here because otherwise the Q library will hide
                // exceptions from us.
                var parseResults = function (data) {
                    try {
                        // Outstanding queries. These get used only if a cell's structure count exceeds the page size.
                        var promises = [];

                        for (var i = 0; i < data.results.length; ++i) {

                            var cell = {
                                id: data.results[i].ID,
                                locations: self.cellLocations.length
                            };

                            // Self is the cellCache--not the promise.
                            self.cells.push(cell);
                            self.cellLocations.push(data.results[i].Locations.results);

                            var nextUri = data.results[i].Locations.__next;
                            if (nextUri) {
                                promises.push(self.loadCellStructuresRemaining(nextUri, cell.locations));
                            }
                        }

                        // Only resolve after all queries have finished.
                        Q.all(promises).then(function () {
                            resolve();
                        });

                    } catch (exception) {
                        self.handleException(exception);
                    }
                };

                volumeQueries.readUri(request)
                    .then(parseResults);
            }
        );

    };

    self.loadCellStructuresRemaining = function (nextUri, index) {

        return Q.promise(function (resolve, reject, notify) {

            var parseResults = function (data) {
                try {
                    self.cellLocations[index] = self.cellLocations[index].concat(data.results);

                    nextUri = data.__next;
                    if (nextUri) {
                        volumeQueries.readUriComplete(nextUri).then(parseResults);
                    } else {
                        resolve();
                    }

                } catch (exception) {
                    self.handleException(exception);
                }s
            };

            volumeQueries.readUriComplete(nextUri).then(parseResults);
        });

    }
});
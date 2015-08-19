/**
 * Copyright (c) Ethan Kerzner 2015
 */
/*
myApp.service('volumeInfo', function (volumeQueries) {

    var self = this;

    self.verbose = false;

    self.bboxMin = [];

    self.bboxMax = [];

    // Keys = StructureID, Values = string name
    self.structureMap = d3.map();

    self.init = function () {
        var deferred = [];
        deferred[0] = self.initBbox();
        deferred[1] = self.initStructureMap();
        return Q.all(deferred);
    };

    self.initBbox = function () {

        var deferred = Q.defer();

    // Requests for bounding box of volume.
    var requests = [];
    requests[0] = "Locations?$select=VolumeX&$orderby=VolumeX asc";
    requests[1] = "Locations?$select=VolumeY&$orderby=VolumeY asc";
    requests[2] = "Locations?$select=Z&$orderby=Z asc";
    requests[3] = "Locations?$select=VolumeX&$orderby=VolumeX desc";
    requests[4] = "Locations?$select=VolumeY&$orderby=VolumeY desc";
    requests[5] = "Locations?$select=Z&$orderby=Z desc";

    var parseResults = function (promises) {

        for (var i = 0; i < promises.length; ++i) {
            if (i == 0) {
                self.bboxMin[0] = promises[i].results[0].VolumeX;
            } else if (i == 1) {
                self.bboxMin[1] = promises[i].results[0].VolumeY;
            } else if (i == 2) {
                self.bboxMin[2] = promises[i].results[0].Z;
            } else if (i == 3) {
                self.bboxMax[0] = promises[i].results[0].VolumeX;
            } else if (i == 4) {
                self.bboxMax[2] = promises[i].results[0].VolumeY;
            } else {
                self.bboxMax[3] = promises[i].results[0].Z;
            }
        }

        if (self.verbose) {
            console.log("bboxMin: " + self.bboxMin.toString());
            console.log("bboxMax: " + self.bboxMax.toString());
        }

        deferred.resolve();
    };

    volumeQueries.readUris(requests)
        .then(parseResults);

    return deferred.promise;
};

    self.initStructureMap = function () {

        var deferred = Q.defer();

        var request = "StructureTypes";

        var parseResult = function (promise) {

            for (var i = 0; i < promise.results.length; ++i) {
                var name = promise.results[i].Name;
                var id = promise.results[i].ID;
                self.structureMap.set(id, name);
            }

            if (self.verbose) {
                console.log("structureMap:");
                console.log(self.structureMap);
            }

            deferred.resolve();
        };

        volumeQueries.readUri(request).then(parseResult).fail(self.error);

        return deferred.promise;
    };
});

    */
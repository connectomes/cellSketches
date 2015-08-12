/**
 * Copyright (c) Ethan Kerzner 2015
 */

myApp.service('volumeQueries', function () {

    var self = this;

    self.serviceUri = "http://websvc1.connectomes.utah.edu/RC1/OData/ConnectomeData.svc/";
    OData.defaultHttpClient.enableJsonpCallback = true;

    self.readUri = function (request) {

        var deferred = Q.defer();

        var success = function (data) {
            deferred.resolve(data);
        };

        var error = function (err) {
            console.log(err);
            throw err;
        };

        OData.read(self.serviceUri + request, success, error);

        return deferred.promise;
    };

    self.readUriComplete = function (request) {

        var deferred = Q.defer();

        var success = function (data) {
            deferred.resolve(data);
        };

        var error = function (err) {
            throw err;
        };

        OData.read(request, success, error);

        return deferred.promise;
    };

    self.readUris = function (requests) {

        var deferred = [];

        for (var i = 0; i < requests.length; ++i) {
            deferred[i] = self.readUri(requests[i]);
        }

        return Q.all(deferred);
    };

});
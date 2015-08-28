/**
 * Copyright (c) Ethan Kerzner 2015
 */

(function () {
    'use strict';

    angular
        .module('formExample')
        .factory('volumeOData', volumeOData);

    volumeOData.$inject = ['$q'];

    function volumeOData($q) {

        var self = this;
        self.serviceUri = "http://websvc1.connectomes.utah.edu/RC1/OData/ConnectomeData.svc/";
        OData.defaultHttpClient.enableJsonpCallback = true;

        var service = {
            request: request,
            requestComplete: requestComplete,
            requestMulti: requestMulti
        };

        return service;

        function request(uri) {

            var deferred = $q.defer();

            var success = function (data) {
                if(data.results.length == 0) {
                    throw "Bad query!"
                }
                deferred.resolve(data);
            };

            var error = function (err) {
                throw err;
            };

            OData.read(self.serviceUri + uri, success, error);

            return deferred.promise;
        }

        function requestComplete(uri) {

            var deferred = $q.defer();

            var success = function (data) {
                deferred.resolve(data);
            };

            var error = function (err) {
                throw err;
            };

            OData.read(uri, success, error);

            return deferred.promise;
        }

        function requestMulti(uris) {
            var deferred = [];

            for (var i = 0; i < uris.length; ++i) {
                deferred[i] = request(uris[i]);
            }

            return $q.all(deferred);
        }

    }

}());
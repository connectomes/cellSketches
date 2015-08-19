/**
 * Copyright (c) Ethan Kerzner 2015
 */

(function () {
    'use strict';

    angular
        .module('formExample')
        .factory('odata', odata);

    odata.$inject = ['$q'];

    function odata($q) {

        var self = this;
        self.serviceUri = "http://websvc1.connectomes.utah.edu/RC1/OData/ConnectomeData.svc/";

        var service = {
            request: request,
            requestComplete: requestComplete,
            requestMulti: requestMulti
        };

        return service;

        function request(uri) {

            var deferred = $q.defer();

            var success = function (data) {
                deferred.resolve(data);
            };

            var error = function (err) {
                deferred.reject(err);
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
                deferred.reject(err);
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
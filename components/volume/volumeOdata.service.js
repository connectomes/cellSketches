(function () {
    'use strict';

    angular
        .module('app.volumeModule')
        .factory('volumeOData', volumeOData);

    volumeOData.$inject = ['$q', '$http', 'toastr'];

    function volumeOData($q, $http, toastr) {

        var self = this;
        self.serviceUri = "http://websvc1.connectomes.utah.edu/RC1/OData/";

        var service = {
            request: request,
            requestComplete: requestComplete,
            requestMulti: requestMulti,
            setVolumeUri: setVolumeUri
        };

        return service;

        function request(uri, config) {

            var deferred = $q.defer();

            var success = function (data) {
                deferred.resolve(data);
            };

            var error = function (err) {
                // TODO - this should tell the user that something broke on the server
                toastr.error("I got a bad response from the server. Try refreshing.", "Bad response from the server");
                throw err;
            };

            $http.get(self.serviceUri + uri, config).then(success, error);

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

            $http.get(uri).then(success, error);

            return deferred.promise;
        }

        function requestMulti(uris) {
            var deferred = [];

            for (var i = 0; i < uris.length; ++i) {
                deferred[i] = request(uris[i]);
            }

            return $q.all(deferred);
        }

        function setVolumeUri(uri) {
            self.serviceUri = uri;
        }

    }

}());
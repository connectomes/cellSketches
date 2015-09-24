(function () {
    'use strict';

    angular
        .module('app.volumeModule')
        .factory('volumeOData', volumeOData);

    volumeOData.$inject = ['$q', '$http'];

    function volumeOData($q, $http) {

        var self = this;
        //self.serviceUri = "http://webdev.connectomes.utah.edu/RC1Test/OData/";
        self.serviceUri = "http://websvc1.connectomes.utah.edu/RC1/OData/";

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
                throw err;
            };

            $http.get(self.serviceUri + uri).then(success, error);

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

    }

}());
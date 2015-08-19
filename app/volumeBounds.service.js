/**
 * Copyright (c) Ethan Kerzner 2015
 */

(function () {
    'use strict';

    angular
        .module('formExample')
        .factory('volumeBounds', volumeBounds);

    volumeBounds.$inject = ['$q', 'volumeOData'];
    OData.defaultHttpClient.enableJsonpCallback = true;

    function volumeBounds($q, volumeOData) {

        var self = this;
        self.bboxMin = [];
        self.bboxMax = [];

        var service = {
            init: init,
            getRangeVolumeX: getRangeVolumeX,
            getRangeVolumeY: getRangeVolumeY,
            getRangeZ: getRangeZ,
            getXyAspectRatio: getXyAspectRatio,
            getXzAspectRation: getXzAspectRatio,
            toString: toString
        };

        return service;

        function getRangeVolumeX() {
            return [self.bboxMin[0], self.bboxMax[0]];
        }

        function getRangeVolumeY() {
            return [self.bboxMin[1], self.bboxMax[1]];
        }

        function getRangeZ() {
            return [self.bboxMin[2], self.bboxMax[2]];
        }

        function getXyAspectRatio() {
            var width = Math.abs(self.bboxMin[0] - self.bboxMax[0]);
            var height = Math.abs(self.bboxMin[1] - self.bboxMax[1]);
            return width / height;
        }

        function getXzAspectRatio() {
            var width = Math.abs(self.bboxMin[0] - self.bboxMax[0]);
            var height = Math.abs(self.bboxMin[2] - self.bboxMax[2]);
            return width / height;
        }

        function init() {

            var deferred = $q.defer();

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
                        self.bboxMax[1] = promises[i].results[0].VolumeY;
                    } else {
                        self.bboxMax[2] = promises[i].results[0].Z;
                    }
                }

                if (self.verbose) {
                    console.log("bboxMin: " + self.bboxMin.toString());
                    console.log("bboxMax: " + self.bboxMax.toString());
                }

                deferred.resolve();
            };

            volumeOData.requestMulti(requests)
                .then(parseResults);

            return deferred.promise;
        }

        function toString() {
            return "bboxMin: " + self.bboxMin.toString() + "\nbboxMax: " + self.bboxMax.toString();
        }
    }

}());
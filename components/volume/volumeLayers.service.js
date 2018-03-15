(function () {
    'use strict';

    angular
        .module('app.volumeModule')
        .factory('volumeLayers', volumeLayers);

    volumeLayers.$inject = ['$q', '$log', 'volumeOData'];

    function volumeLayers($q, $log, volumeOData) {

        var self = this;
        self.upper = [];
        self.lower = [];
        self.hasBoundaries = false;

        self.ConversionModes = {
            PERCENT_DIFFERENCE: 0,
            NORMALIZED_DEPTH: 1
        };

        var service = {
            activate: activate,
            convertPoint: convertPoint,
            getZAtMeshIntersectionPoint: getZAtMeshIntersectionPoint,
            getZAtMeshIntersectionOrAverage: getZAtMeshIntersectionOrAverage,
            getZWithPointAverages: getZWithPointAverages,
            getLowerBounds: getLowerBounds,
            getLowerBoundsMesh: getLowerBoundsMesh,
            getUpperBounds: getUpperBounds,
            getUpperBoundsMesh: getUpperBoundsMesh,
            hasBoundaries: hasBoundaries,
            setSearchRadius: setSearchRadius,
            reset: reset
        };

        service.ConversionModes = self.ConversionModes;

        return service;

        function activate() {

            var deferred = $q.defer();

            // Requests for upper and lower boundaries of IPL.
            var requests = [];
            requests[0] = "Structures?$filter=(TypeID eq 224)&$expand=Locations";
            requests[1] = "Structures?$filter=(TypeID eq 235)&$expand=Locations";

            var parseResults = function (promises) {

                for (var i = 0; i < promises.length; ++i) {

                    if (promises[i].data && promises[i].data.value.length) {

                        var locations = promises[i].data.value[0].Locations;

                        for (var j = 0; j < locations.length; ++j) {

                            var currLocation = locations[j];
                            var location = {
                                position: new utils.Point3D(currLocation.VolumeY, currLocation.VolumeX, currLocation.Z),
                                id: locations[j].ID
                            };

                            if (i == 0) {
                                self.upper.push(location);
                            } else if (i == 1) {
                                self.lower.push(location);
                            }
                        }
                    }
                }

                if(self.upper.length && self.lower.length) {
                    self.hasBoundaries = true;
                    var material = new THREE.MeshBasicMaterial({
                        side: THREE.DoubleSide,
                        wireframe: true, color: 0xcccccc
                    });

                    var geometry = createBoundaryGeometry(self.upper);
                    self.upperMesh = new THREE.Mesh(geometry, material);

                    geometry = createBoundaryGeometry(self.lower);
                    self.lowerMesh = new THREE.Mesh(geometry, material);


                }
                   deferred.resolve();
            };

            volumeOData.requestMulti(requests)
                .then(parseResults);

            self.searchRadius = 15000;

            return deferred.promise;
        }

        function convertPoint(point, mode, useMesh, radius) {
            var result = {};
            if (mode == self.ConversionModes.NORMALIZED_DEPTH) {

                var upperZ = undefined;
                if (useMesh) {
                    result = getZAtMeshIntersectionOrAverage(point, self.upperMesh, self.upper);
                } else {
                    result.z = getZWithPointAverages(point, self.upper, radius);
                    result.usedMesh = false;
                }
                result.z = point.z - result.z;

                return result;

            } else if (mode == self.ConversionModes.PERCENT_DIFFERENCE) {

                upperZ = undefined;
                var lowerZ = undefined;

                if (useMesh) {
                    var upperResult = getZAtMeshIntersectionOrAverage(point, self.upperMesh, self.upper);
                    var lowerResult = getZAtMeshIntersectionOrAverage(point, self.lowerMesh, self.lower);
                    upperZ = upperResult.z;
                    lowerZ = lowerResult.z;
                    result.usedMesh = upperResult.usedMesh && lowerResult.usedMesh;
                } else {
                    upperZ = getZWithPointAverages(point, self.upper, radius);
                    lowerZ = getZWithPointAverages(point, self.lower, radius);
                    result.usedMesh = false;
                }

                result.z = (point.z - upperZ) / (lowerZ - upperZ);

                return result;

            } else {
                throw 'Invalid conversion mode!';
            }
        }

        /**
         * @desc Converts locations into a THREE.js mesh.
         */
        function createBoundaryGeometry(locations) {
            var points = [];

            for (var i = 0; i < locations.length; ++i) {
                points.push([locations[i].position.x, locations[i].position.y]);
            }

            var triangles = Triangulate.triangulate(points);

            var geometry = new THREE.Geometry();
            for (i = 0; i < locations.length; ++i) {
                var point = locations[i].position;
                geometry.vertices.push(new THREE.Vector3(point.x, point.y, point.z));
            }

            for (i = 0; i < triangles.length; ++i) {
                geometry.faces.push(new THREE.Face3(triangles[i][0], triangles[i][1], triangles[i][2]));
            }

            return geometry;
        }

        function hasBoundaries() {
            return self.hasBoundaries;
        }

        /**
         * @desc Shoots a ray in the +z direction to find distance from a point to a boundary mesh. If there are no
         * intersections then shoot in the -z direction.
         */
        function getZAtMeshIntersectionPoint(point, mesh) {
            var raycaster = new THREE.Raycaster();
            var origin = new THREE.Vector3(point.x, point.y, point.z);
            var direction = new THREE.Vector3(0, 0, 1);

            raycaster.set(origin, direction);

            var intersections = raycaster.intersectObject(mesh, true);
            if (intersections.length == 0) {
                direction = new THREE.Vector3(0, 0, -1);
                raycaster.set(origin, direction);
                intersections = raycaster.intersectObject(mesh, true);
            }

            if (intersections.length == 0) {
                return null;
            } else if (intersections.length >= 1) {
                return intersections[0].point.z;
            }
        }

        /**
         * @desc Tries to get z-position in the boundary using a the mesh. If that fails, fall back to nearest neighbor.
         */
        function getZAtMeshIntersectionOrAverage(point, mesh, boundary) {
            var z = getZAtMeshIntersectionPoint(point, mesh);
            var usedMesh = true;
            if (!z) {
                z = getZWithPointAverages(point, boundary, 0);
                usedMesh = false
            }

            return {
                z: z,
                usedMesh: usedMesh
            };
        }

        /**
         * @desc Get the z-position in the boundary by using a weighted average of nearby points.
         */
        function getZWithPointAverages(point, boundary, searchRadius) {

            // Initialize the nearest neighbor with first point in array.
            var current = boundary[0].position.getAs2D();
            var nearestDistance = current.distance(point);
            var nearestIndex = 0;

            // Keep list of all valid points in the search radius.
            var pointsInRadiusIndexes = [];
            var distancesInRadius = [];

            // Search for points.
            for (var i = 0; i < boundary.length; ++i) {
                current = boundary[i].position.getAs2D();
                var distance = current.distance(point);

                // Nearest neighbor?
                if (distance < nearestDistance) {
                    nearestDistance = distance;
                    nearestIndex = i;
                }

                // Point in search radius?
                if (distance < searchRadius) {
                    pointsInRadiusIndexes.push(i);
                    distancesInRadius.push(distance);
                }
            }

            // Found no points => return the nearest neighbor.
            if (pointsInRadiusIndexes.length == 0) {
                return boundary[nearestIndex].position.z;
            }

            // Found one or more points. Compute weighted average of z-values.
            var totalDepth = 0.0;
            var totalDistance = 0.0;
            for (i = 0; i < pointsInRadiusIndexes.length; ++i) {
                var currPoint = boundary[pointsInRadiusIndexes[i]].position;
                totalDepth += (currPoint.z * distancesInRadius[i]);
                totalDistance += distancesInRadius[i];
            }
            return (totalDepth / totalDistance);
        }

        function getUpperBounds() {
            return self.upper;
        }

        function getUpperBoundsMesh() {
            return self.upperMesh;
        }

        function getLowerBounds() {
            return self.lower;
        }

        function getLowerBoundsMesh() {
            return self.lowerMesh;
        }

        function reset() {
            self.upper = [];
            self.lower = [];
            self.hasBoundaries = false;
        }

        function setSearchRadius(radius) {
            self.searchRadius = radius;
        }
    }
}());
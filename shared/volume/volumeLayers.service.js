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

        self.ConversionModes = {
            NORMALIZED_DEPTH: 0,
            PERCENT_DIFFERENCE: 1
        };

        var service = {
            activate: activate,
            convertPoint: convertPoint,
            convertToIPLPercent: convertToIPLPercent,
            getMeshIntersectionPoint: getMeshIntersectionPoint,
            getLowerBounds: getLowerBounds,
            getLowerBoundsMesh: getLowerBoundsMesh,
            getUpperBounds: getUpperBounds,
            getUpperBoundsMesh: getUpperBoundsMesh,
            setSearchRadius: setSearchRadius
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

                var material = new THREE.MeshBasicMaterial({side: THREE.DoubleSide});

                var geometry = createBoundaryGeometry(self.upper);
                self.upperMesh = new THREE.Mesh(geometry, material);

                geometry = createBoundaryGeometry(self.lower);
                self.lowerMesh = new THREE.Mesh(geometry, material);

                deferred.resolve();
            };

            volumeOData.requestMulti(requests)
                .then(parseResults);

            self.searchRadius = 15000;

            return deferred.promise;
        }

        function convertPoint(point, mode, useMesh, radius) {
            if (mode == self.ConversionModes.NORMALIZED_DEPTH) {

                var upperZ = undefined;
                if (useMesh) {
                    $log.debug("upper mesh");
                    upperZ = getMeshIntersectionPoint(point, self.upperMesh).z;
                } else {
                    upperZ = getZAtBoundaryWithPointAverages(point, self.upper, radius);
                }

                return point.z - upperZ;

            } else if (mode == self.ConversionModes.PERCENT_DIFFERENCE) {

                upperZ = undefined;
                var lowerZ = undefined;

                if (useMesh) {
                    $log.debug("upper mesh");
                    upperZ = getMeshIntersectionPoint(point, self.upperMesh).z;
                    $log.debug("lower mesh");
                    lowerZ = getMeshIntersectionPoint(point, self.lowerMesh).z;
                } else {
                    upperZ = getZAtBoundaryWithPointAverages(point, self.upper, radius);
                    lowerZ = getZAtBoundaryWithPointAverages(point, self.lower, radius);
                }

                //return (point.z - averageDepths[1]) / (averageDepths[0] - averageDepths[1]);
                return (point.z - upperZ) / (lowerZ - upperZ);

            } else {
                throw 'Invalid conversion mode!';
            }
        }

        /*
         * Get the z-position in the boundary by using a weighted average of the boundary points within search radius.
         */
        function getZAtBoundaryWithPointAverages(point, boundary, searchRadius) {

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
                return boundary[nearestIndex].z;
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

        function convertToIPLPercent(point, useOnlyTopMarkers) {

            var inputPoint = point.getAs2D();

            // Same indexes used throughout this method.
            // nearestIdxs[0] = index of nearest neighbor on bottom of layer.
            // nearestIdxs[1] = index of nearest neighbor on top of layer.
            var nearestIndexes = [];
            var nearestDistances = [];
            var pointsInRadiusIdxs = [[], []];
            var distancesInRadius = [[], []];

            // Initialize upper and lower nearest neighbor points.
            var boundaries = [self.lower, self.upper];
            for (var i = 0; i < boundaries.length; ++i) {
                var currBoundary = boundaries[i];
                var current = currBoundary[0].position.getAs2D();
                nearestIndexes[i] = 0;
                nearestDistances[i] = current.distance(inputPoint);
            }

            // Search for nearest neighbor and points in radius.
            for (i = 0; i < boundaries.length; ++i) {
                currBoundary = boundaries[i];
                for (var j = 0; j < currBoundary.length; ++j) {
                    // TODO: use the point structure.
                    current = currBoundary[j].position.getAs2D();
                    var distance = current.distance(inputPoint);

                    // Nearest neighbor for current boundary?
                    if (distance < nearestDistances[i]) {
                        nearestDistances[i] = distance;
                        nearestIndexes[i] = j;
                    }

                    // Point in search radius?
                    if (distance < self.searchRadius) {
                        pointsInRadiusIdxs[i].push(j);
                        distancesInRadius[i].push(distance);
                    }
                }
            }

            // Compute average of depth values weighted by distance from point.
            var averageDepths = [];

            for (i = 0; i < boundaries.length; ++i) {
                currBoundary = boundaries[i];
                var currPointsInRadius = pointsInRadiusIdxs[i];
                var currDistancesInRadius = distancesInRadius[i];

                // No points in search radius -> use nearest point as our best guess.
                if (pointsInRadiusIdxs[i].length == 0) {
                    averageDepths[i] = currBoundary[nearestIndexes[i]].position.z;
                    pointsInRadiusIdxs[i].push(nearestIndexes[i]);
                } else {
                    var totalDepth = 0.0;
                    var totalDistance = 0.0;

                    for (j = 0; j < currPointsInRadius.length; ++j) {
                        var currPoint = currBoundary[currPointsInRadius[j]].position;
                        totalDepth += (currPoint.z * currDistancesInRadius[j]);
                        totalDistance += currDistancesInRadius[j];
                    }
                    averageDepths[i] = (totalDepth / totalDistance);
                }
            }

            var percent = undefined;
            if (useOnlyTopMarkers) {
                percent = (point.z - averageDepths[1]);
            } else {
                percent = (point.z - averageDepths[1]) / (averageDepths[0] - averageDepths[1]);
            }

            console.log(convertPoint(point, self.ConversionModes.NORMALIZED_DEPTH, false, 15000));
            console.log(convertPoint(point, self.ConversionModes.NORMALIZED_DEPTH, true));
            console.log(convertPoint(point, self.ConversionModes.PERCENT_DIFFERENCE, false, 15000));
            console.log(convertPoint(point, self.ConversionModes.PERCENT_DIFFERENCE, true));

            return {
                bottomIndexes: pointsInRadiusIdxs[0],
                topIndexes: pointsInRadiusIdxs[1],
                percent: percent
            };
        }

        /*
         * Converts volume locations into a triangle mesh using 2D-delaunay triangulation.
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

        /*
         * Shoots a ray in the +z direction to find distance from a point to a boundary mesh. If there are no
         * intersections then shoot in the -z direction. If still no intersecions, then throw an error!
         */
        function getMeshIntersectionPoint(point, mesh) {
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
                console.log("[" + point.x + ", " + point.y + "," + point.z + "]");
                throw 'Failed to find intersections when getting distance to mesh';
            } else if (intersections.length == 1) {
                return new utils.Point3D(intersections[0].point.x, intersections[0].point.y, intersections[0].point.z);
            } else if (intersections.length > 1) {
                throw 'Found more than one intersection when converting point';
            }
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

        function setSearchRadius(radius) {
            self.searchRadius = radius;
        }
    }
}());
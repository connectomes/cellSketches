(function () {
    'use strict';

    angular
        .module('app.volumeModule')
        .factory('volumeCells', volumeCells);

    volumeCells.$inject = ['$q', '$http', 'volumeOData', 'volumeStructures'];

    function volumeCells($q, $http, volumeOData, volumeStructures) {

        var self = this;
        // Places where data will be stored.
        self.cells = [];
        self.cellLocations = [];
        self.cellChildren = [];
        self.cellChildrenLocations = [];
        self.cellChildrenPartners = [];
        self.cellCentroids = [];

        // Constant configurable values
        self.maxCellsInFilter = 15;

        var service = {
            getAllAvailableChildTypes: getAllAvailableChildTypes,
            getAllAvailableGroups: getAllAvailableGroups,
            getCell: getCell,
            getCellAt: getCellAt,
            getCellCentroidAt: getCellCentroidAt,
            getCellChildAt: getCellChildAt,
            getCellChildCentroidAt: getCellChildCentroidAt,
            getCellChildLocationsAt: getCellChildLocationsAt,
            getCellChildPartnerAt: getCellChildPartnerAt,
            getCellChildRadiusAt: getCellChildRadiusAt,
            getCellChildrenByTypeIndexes: getCellChildrenByTypeIndexes,
            getCellChildrenConnectedToIndexes: getCellChildrenConnectedToIndexes,
            getCellChildrenConnectedToGroupIndex: getCellChildrenConnectedToGroupIndex,
            getCellConvexHullAt: getCellConvexHullAt,
            getCellIndex: getCellIndex,
            getCellIndexesInLabel: getCellIndexesInLabel,
            getCellIndexesInLabelRegExp: getCellIndexesInLabelRegExp,
            getCellIndexesInGroup: getCellIndexesInGroup,
            getCellLocations: getCellLocations,
            getCellNeighborIdFromChildAndPartner: getCellNeighborIdFromChildAndPartner,
            getCellNeighborIdsAt: getCellNeighborIdsAt,
            getCellNeighborIndexesByChildType: getCellNeighborIndexesByChildType,
            getCellNeighborLabelsByChildType: getCellNeighborLabelsByChildType,
            getLoadedCellIds: getLoadedCellIds,
            getNumCellChildrenAt: getNumCellChildrenAt,
            getNumCells: getNumCells,
            hasLoadedNeighbors: hasLoadedNeighbors,
            loadCellChildrenAt: loadCellChildrenAt,
            loadCellId: loadCellId,
            loadCellIds: loadCellIds,
            loadCellLabel: loadCellLabel,
            loadCellLabels: loadCellLabels,
            loadCellLocationsAt: loadCellLocationsAt,
            loadCellChildPartnersAt: loadCellChildPartnersAt,
            loadCellNeighborsAt: loadCellNeighborsAt,
            loadCellStartsWith: loadCellStartsWith,
            loadFromFile: loadFromFile,
            removeCellId: removeCellId,
            reset: reset,
            saveAsFile: saveAsFile
        };

        return service;

        function failure(err) {
            throw err;
        }

        function getAllAvailableChildTypes() {
            var childTypes = [];
            for (var i = 0; i < self.cells.length; ++i) {
                var children = self.cellChildren[i];
                if (children) {
                    for (var j = 0; j < children.length; ++j) {
                        var currType = children[j].type;
                        if (childTypes.indexOf(currType) == -1) {
                            childTypes.push(currType);
                        }
                    }
                }
            }
            return childTypes;
        }

        function getAllAvailableGroups() {

            var groups = [];
            for (var i = 0; i < volumeStructures.getNumGroups(); ++i) {

                if (i == volumeStructures.getGroupIndexInClass() || i == volumeStructures.getGroupIndexSelf()) {
                    groups.push(i);
                }

                var labels = volumeStructures.getLabelsInGroup(i);

                for (var j = 0; j < self.cells.length; ++j) {
                    if (labels.indexOf(self.cells[j].label) != -1) {
                        groups.push(i);
                        break;
                    }
                }

            }
            return groups;
        }

        function getCell(cellId) {
            for (var i = 0; i < self.cells.length; ++i) {
                if (self.cells[i].id == cellId) {
                    return self.cells[i];
                }
            }
            throw 'Error - tried to get cell ID, but it wasn\'t loaded yet:' + cellId;
        }

        function getCellAt(index) {
            return self.cells[index];
        }

        function getCellCentroidAt(cellIndex) {
            return self.cellCentroids[cellIndex];
        }

        function getCellChildAt(cellIndex, childIndex) {
            return self.cellChildren[cellIndex][childIndex];
        }

        function getCellChildCentroidAt(cellIndex, childIndex) {
            // Get locations, convert to convex hull, return centroid of the hull.
            var locations = getCellChildLocationsAt(cellIndex, childIndex);
            var hull = getConvexHullFromLocations(locations);
            var centroid = hull.centroid();
            return new utils.Point2D(centroid[0], centroid[1]);
        }

        function getCellChildLocationsAt(cellIndex, childIndex) {
            return self.cellChildrenLocations[cellIndex][childIndex]
        }

        function getCellChildPartnerAt(cellIndex, childIndex) {
            return self.cellChildrenPartners[cellIndex][childIndex];
        }

        function getCellChildRadiusAt(cellIndex, childIndex) {
            var locations = getCellChildLocationsAt(cellIndex, childIndex);
            var radius = 0;
            for (var i = 0; i < locations.length; ++i) {
                radius = Math.max(locations[i].radius, radius);
            }

            return radius;
        }

        function getCellChildrenByTypeIndexes(cellIndex, childType) {
            var cellChildren = self.cellChildren[cellIndex];
            var currChildren = [];
            var i;
            if (childType) {

                var isChildTypeArray = (childType.length != undefined);
                for (i = 0; i < cellChildren.length; ++i) {
                    if (!isChildTypeArray && childType && cellChildren[i].type == childType) {
                        currChildren.push(i);
                    } else if (childType == undefined) {
                        currChildren.push(i);
                    } else if (isChildTypeArray && childType && childType.indexOf(cellChildren[i].type) > -1) {
                        currChildren.push(i);
                    }
                }


            } else {

                for (i = 0; i < cellChildren.length; ++i) {
                    currChildren.push(i);
                }
            }
            return currChildren;
        }

        function getCellChildrenConnectedToGroupIndex(cellIndex, groupIndex, childType) {
            var targetIndexes = getCellIndexesInGroup(groupIndex, cellIndex);
            return getCellChildrenConnectedToIndexes(cellIndex, targetIndexes, childType);
        }

        /**
         * @name getCellChildrenConnectedTo
         * @returns Object of cell's child indexes that are connected to partnerIndexes and of the specified type.
         */
        function getCellChildrenConnectedToIndexes(cellIndex, targetIndexes, childType) {

            var indexes = [];
            var partnerOffsets = [];

            var children = getCellChildrenByTypeIndexes(cellIndex, childType);

            for (var i = 0; i < children.length; ++i) {
                var currIndex = children[i];

                var partners = self.cellChildrenPartners[cellIndex][currIndex].neighborIds;
                for (var j = 0; j < partners.length; ++j) {
                    if (targetIndexes.indexOf(getCellIndex(partners[j])) != -1) {
                        indexes.push(currIndex);
                        partnerOffsets.push(j);
                    }
                }
            }

            return {
                indexes: indexes,
                partners: partnerOffsets
            };
        }

        function getCellConvexHullAt(cellIndex) {
            var locations = self.cellLocations[cellIndex];
            return getConvexHullFromLocations(locations);
        }

        function getCellIndex(cellId) {

            for (var i = 0; i < self.cells.length; ++i) {
                if (self.cells[i].id == cellId) {
                    return i;
                }
            }

            return -1;
        }

        /**
         * @name getCellIndexesInGroup
         * @desc Returns a list of the loaded cell indexes that are in the
         * @param groupIndex -- see volumeStructure's groups.
         * @param cellIndex is needed b/c groups like 'in class' and 'self' are defined relative to a cell
         */
        function getCellIndexesInGroup(groupIndex, cellIndex) {
            var indexes = [];
            var labels = [];

            var cellLabel = self.cells[cellIndex].label;
            if (groupIndex == volumeStructures.getGroupIndexSelf()) {
                return [cellIndex];
            }

            if (groupIndex == volumeStructures.getGroupIndexInClass()) {
                labels.push(self.cells[cellIndex].label);
            } else {
                labels = volumeStructures.getLabelsInGroup(groupIndex);

                var indexInLabels = labels.indexOf(cellLabel);
                if (indexInLabels != -1) {
                    labels.splice(indexInLabels, 1);
                }
            }

            for (var i = 0; i < self.cells.length; ++i) {
                if (labels.indexOf(self.cells[i].label) != -1 && i != cellIndex) {
                    indexes.push(i);
                }
            }

            return indexes;
        }

        function getCellIndexesInLabel(label, cellIndex) {

            var indexes = [];
            var i;

            if (label != 'Self') {
                for (i = 0; i < self.cells.length; ++i) {
                    if (i != cellIndex) {
                        if (self.cells[i].label == label) {
                            indexes.push(i);
                        }
                    }
                }
            } else if (label == 'Self') {
                indexes.push(cellIndex);
            }

            return indexes;
        }

        function getCellIndexesInLabelRegExp(regexp) {
            var indexes = [];
            for (var i = 0; i < self.cells.length; ++i) {
                var match = regexp.exec(self.cells[i].label);
                if (match) {
                    indexes.push(i);
                }
            }
            return indexes;
        }

        function getCellLocations(id) {
            for (var i = 0; i < self.cells.length; ++i) {
                if (self.cells[i].id == id) {
                    return self.cellLocations[i];
                }
            }
            throw 'Error - tried to get locations of this cell ID, but they weren\'t loaded yet:' + id;
        }

        function getCellNeighborIdFromChildAndPartner(cellIndex, childIndex, partnerIndex) {
            var childPartners = getCellChildPartnerAt(cellIndex, childIndex);
            return childPartners.neighborIds[partnerIndex];
        }

        function getCellNeighborIdsAt(cellIndex) {
            var partners = self.cellChildrenPartners[cellIndex];
            var neighbors = [];

            for (var i = 0; i < partners.length; ++i) {

                var currNeighbors = partners[i].neighborIds;

                for (var j = 0; j < currNeighbors.length; ++j) {

                    if (neighbors.indexOf(currNeighbors[j]) == -1) {
                        neighbors.push(currNeighbors[j]);
                    }

                }

            }
            return neighbors;
        }

        function getCellNeighborIndexesByChildType(cellIndex, childType) {

            var childTypeSet = false;
            var children = self.cellChildren[cellIndex];
            var partners = self.cellChildrenPartners[cellIndex];
            var neighbors = []; // to be returned

            if (childType != undefined) {
                childTypeSet = true;
                children = getCellChildrenByTypeIndexes(cellIndex, childType);
            }

            for (var i = 0; i < children.length; ++i) {

                var currChildIndex = i;
                if (childTypeSet) {
                    currChildIndex = children[i];
                }

                var parentIds = partners[currChildIndex].neighborIds;
                for (var j = 0; j < parentIds.length; ++j) {
                    var currParentId = parentIds[j];
                    if (currParentId != -1) {
                        var parentIndex = getCellIndex(currParentId);
                        neighbors.push({
                            neighborIndex: parentIndex,
                            childIndex: currChildIndex
                        });
                    }
                }

            }

            return neighbors;
        }

        /**
         * @name getCellNeighborLabelsByChildType
         * @desc Returns a cell's neighbors' labels reachable by a specific child type.
         * @returns Array of objects. each object contains a 'label' and 'indexes' field.
         */
        function getCellNeighborLabelsByChildType(cellIndex, childType) {

            var neighbors = getCellNeighborIndexesByChildType(cellIndex, childType);

            var labels = [];

            for (var i = 0; i < neighbors.length; ++i) {

                var currNeighbor = getCellAt(neighbors[i].neighborIndex);
                var found = false;
                var currLabel;

                if (neighbors[i].neighborIndex == cellIndex) {
                    currLabel = 'Self';
                } else {
                    currLabel = currNeighbor.label;
                }

                // If currNeighbor's label is already in labels then add it to the per-label indexes. Else, create a new
                // entry in labels for currNeighbor.
                for (var j = 0; j < labels.length; ++j) {

                    if (labels[j].label == currLabel) {

                        found = true;

                        if (labels[j].neighborIndexes.indexOf(neighbors[i].neighborIndex) == -1) {
                            labels[j].neighborIndexes.push(neighbors[i].neighborIndex);
                            labels[j].childIndexes.push(neighbors[i].childIndex);
                        }

                        break;
                    }
                }

                if (!found) {
                    labels.push({
                        label: currLabel,
                        neighborIndexes: [neighbors[i].neighborIndex],
                        childIndexes: [neighbors[i].childIndex]
                    });
                }
            }

            return labels;
        }

        function getConvexHullFromLocations(locations) {
            var vertices = [];
            for (var i = 0; i < locations.length; ++i) {
                vertices.push([locations[i].position.x, locations[i].position.y]);
            }
            var hull = d3.geom.hull(vertices);
            return d3.geom.polygon(hull);
        }

        function getLoadedCellIds() {
            var ids = [];
            for (var i = 0; i < self.cells.length; ++i) {
                ids.push(self.cells[i].id);
            }
            return ids;
        }

        function getNumCellChildrenAt(cellIndex) {
            return self.cellChildren[cellIndex].length;
        }

        function getNumCells() {
            return self.cells.length;
        }

        function hasLoadedNeighbors(cellIndex) {

            var neighbors = getCellNeighborIdsAt(cellIndex);

            for (var i = 0; i < neighbors.length; ++i) {

                if (getCellIndex(neighbors[i]) == -1) {
                    return false;
                }

            }
            return true;
        }

        function loadCellChildPartnersAt(cellIndex) {

            var cellId = getCellAt(cellIndex).id;

            return $q(function (resolve, reject) {

                var request = 'Structures(' + cellId + ')/Children?$expand=SourceOfLinks($expand=Target($select=ParentID)),TargetOfLinks($expand=Source($select=ParentID))';

                function parseChildPartners(data) {

                    var values = data.data.value;

                    var orderedPartners = [];

                    for (var i = 0; i < values.length; ++i) {

                        var sources = values[i].SourceOfLinks;
                        var targets = values[i].TargetOfLinks;

                        var childIsSource = sources.length > 0;
                        var childIsTarget = targets.length > 0;

                        if (childIsTarget && childIsSource) {

                            console.log(values[i]);
                            console.log('Error - found child that is both source and target?!');

                        }

                        if (values[i].ParentID != cellId) {

                            throw 'Error - found child edge for wrong cell!';

                        }

                        if (values[i].ID != getCellChildAt(getCellIndex(cellId), i).id) {

                            throw 'Error - children edges out-of-order!';

                        }

                        var neighborIds = [];
                        var childIds = [];
                        var linksBidirectional = [];

                        if (childIsSource) {

                            for (var j = 0; j < sources.length; ++j) {

                                var currSource = sources[j];

                                if (currSource.hasOwnProperty('Source')) {

                                    console.log(values[i]);
                                    console.log('Error - found source-to-source link.');

                                } else if (currSource.hasOwnProperty('Target')) {

                                    if (currSource.Target.ParentID == null) {

                                        console.log(currSource);
                                        console.log('Warning - cell link with null parent. This shouldn\'t exist!');

                                    }

                                    neighborIds.push(currSource.Target.ParentID);
                                    childIds.push(currSource.TargetID);
                                    linksBidirectional.push(currSource.Bidirectional)

                                } else {

                                    console.log(values[i]);
                                    console.log('Error - source with no target.');

                                }

                            }

                        } else if (childIsTarget) {

                            for (j = 0; j < targets.length; ++j) {

                                var currTarget = targets[j];

                                if (currTarget.hasOwnProperty('Source')) {

                                    if (currTarget.Source.ParentID == null) {

                                        console.log(currTarget);
                                        console.log('Warning - cell link with null parent. This shouldn\'t exist!');

                                    }

                                    neighborIds.push(currTarget.Source.ParentID);
                                    childIds.push(currTarget.SourceID);
                                    linksBidirectional.push(currTarget.Bidirectional);

                                } else if (currTarget.hasOwnProperty('Target')) {

                                    console.log(values[i]);
                                    console.log('Error - target-to-target link.');

                                } else {

                                    console.log(values[i]);
                                    console.log('Error - target with no source');

                                }

                            }

                        }

                        orderedPartners.push(new utils.CellPartner(neighborIds, childIds, linksBidirectional));

                        resolve({
                            validIndexes: [cellIndex],
                            invalidIndexes: []
                        });

                    }

                    self.cellChildrenPartners[cellIndex] = orderedPartners;

                }

                volumeOData.request(request).then(parseChildPartners, failure);
            });
        }

        function loadCellChildrenAt(index) {

            var cellId = getCellAt(index).id;

            return $q(function (resolve, reject) {

                var request = 'Structures?$filter=(ParentID eq ' + cellId + ')&$expand=Locations($select=Radius,VolumeX,VolumeY,Z,ParentID,ID)';

                function success(data) {
                    var cellChildren = data.data.value;
                    var children = [];
                    var locations = [];
                    for (var i = 0; i < cellChildren.length; ++i) {

                        var currChild = cellChildren[i];

                        if (currChild.Locations.length == 0) {
                            console.log('Warning - cell child with no locations, ignoring it');
                            console.log('StructureID: ' + currChild.ID);
                        }

                        var cellChild = new utils.CellChild(currChild.ID, currChild.ParentID, currChild.Label,
                            currChild.Notes, currChild.Tags, currChild.TypeID, currChild.Confidence);

                        var currChildlocations = [];
                        for (var j = 0; j < currChild.Locations.length; ++j) {

                            var currLocation = currChild.Locations[j];
                            var location = new utils.Location(currLocation.ID, currLocation.ParentID, currLocation.VolumeX, currLocation.VolumeY, currLocation.Z, currLocation.Radius);
                            currChildlocations.push(location);
                        }

                        children.push(cellChild);
                        locations.push(currChildlocations);
                    }

                    self.cellChildren[index] = children;
                    self.cellChildrenLocations[index] = locations;

                    //TODO: assert(self.cellChildren[i].length == self.cellChildrenLocations[i].length)

                    resolve({
                        validIndexes: [index],
                        invalidIndexes: []
                    });
                }

                volumeOData.request(request).then(success, failure);
            });
        }

        function loadCellId(id) {
            return loadCellIds([id]);
        }

        function loadCellIds(cellIds) {

            var filter = '(';
            var promises = [];
            var numCellsInFilter = 0;
            var requestIds = [];
            for (var i = 0; i < cellIds.length; ++i) {

                // Is ID already loaded?
                if (getCellIndex(cellIds[i]) > -1) {
                    continue;
                }

                // This is where the cell gets stored when it gets returned from request.
                var cell = new utils.Cell(cellIds[i]);
                self.cells.push(cell);

                // Append to the monster filter.
                if (i == 0 || filter == '(') {
                    filter = filter + 'ID eq ' + cellIds[i];
                    requestIds.push(cellIds[i]);
                } else {
                    filter = filter + ' or ID eq ' + cellIds[i];
                    requestIds.push(cellIds[i]);
                }
                numCellsInFilter++;

                // Start request and reset filter.
                if (numCellsInFilter > self.maxCellsInFilter) {
                    filter = filter + ')';
                    promises.push(loadCellIdsFromFilter(filter, requestIds));
                    requestIds = [];
                    filter = '(';
                    numCellsInFilter = 0;
                }
            }

            // Finished all cells, is there anything left in the filter?
            if (numCellsInFilter > 0) {
                filter = filter + ')';
                promises.push(loadCellIdsFromFilter(filter, requestIds));
            }

            return $q.all(promises);
        }

        function loadCellIdsFromFilter(filter, requestIds) {

            return $q(function (resolve, reject) {

                function success(data) {
                    var requestIds = data.config.requestIds;
                    parseCellData(data, requestIds, resolve, reject);
                }

                // Stash the list of Ids that we're requesting. When the data comes back, parseCellData will check that
                // all the cells we asked for came back from the server. If a cell doesn't come back then we need to
                // tell the user that it doesn't exist!
                var config = {
                    requestIds: requestIds
                };

                volumeOData.request(('Structures?$filter=' + filter), config).then(success, failure);

            });
        }

        function loadCellLabel(label) {

            return $q(function (resolve, reject) {

                var request = "Structures?$filter=(Label eq + %27" + label + "%27)&$select=ID";

                function success(data) {

                    var promises = [];

                    var cellIds = data.data.value;
                    var ids = [];

                    for (var i = 0; i < cellIds.length; ++i) {
                        ids.push(cellIds[i].ID);
                    }

                    promises.push(loadCellIds(ids));

                    $q.all(promises).then(function () {
                        resolve();
                    });
                }

                volumeOData.request(request).then(success, failure);
            });

        }

        function loadCellLabels(labels) {

            var promises = [];

            for (var i = 0; i < labels.length; ++i) {
                promises[i] = loadCellLabel(labels[i]);
            }

            return $q.all(promises);
        }

        function loadCellLocationsAt(cellIndex) {

            var cellId = getCellAt(cellIndex).id;

            return $q(function (resolve, reject) {

                var request = 'Locations?$filter=(ParentID eq ' + cellId + ')&$select=Radius,VolumeX,VolumeY,Z,ParentID,ID';

                function success(data) {

                    var values = data.data.value;
                    var locations = [];
                    for (var i = 0; i < values.length; ++i) {
                        var currLocation = values[i];
                        var location = new utils.Location(currLocation.ID, currLocation.ParentID, currLocation.VolumeX, currLocation.VolumeY, currLocation.Z, currLocation.Radius);
                        locations.push(location);
                    }

                    self.cellLocations[cellIndex] = locations;

                    var hull = getCellConvexHullAt(cellIndex);
                    self.cellCentroids[cellIndex] = new utils.Point2D(hull.centroid()[0], hull.centroid()[1]);

                    resolve({
                        validIndexes: [cellIndex],
                        invalidIndexes: []
                    });
                }

                volumeOData.request(request).then(success, failure);
            });
        }

        function loadCellStartsWith(label) {

            return $q(function (resolve, reject) {

                var request = "Structures?$filter=(startswith(Label,%27" + label + "%27) and TypeID eq 1)&$select=ID";

                function success(data) {

                    var promises = [];

                    var cellIds = data.data.value;
                    var ids = [];
                    for (var i = 0; i < cellIds.length; ++i) {
                        ids.push(cellIds[i].ID);
                    }

                    promises.push(loadCellIds(ids));

                    $q.all(promises).then(function () {
                        resolve();
                    });
                }

                volumeOData.request(request).then(success, failure);
            });
        }

        function loadCellNeighborsAt(cellIndex) {

            var neighbors = getCellNeighborIdsAt(cellIndex);
            var needToLoad = [];

            for (var i = 0; i < neighbors.length; ++i) {
                var currNeighbor = neighbors[i];
                if (getCellIndex(currNeighbor) == -1 && currNeighbor != null) {
                    needToLoad.push(currNeighbor);
                }
            }

            return loadCellIds(needToLoad);
        }

        function loadFromFile(filename) {

            return $q(function (resolve, reject) {

                function success(data) {

                    // Create new objects for each of the saved object-literals.
                    // There must be a better way to do this...
                    var values = data.data.value;

                    // Parse cells.
                    var numCells = values.cells.length;
                    for (var i = 0; i < numCells; ++i) {
                        var currCell = values.cells[i];
                        var cell = new utils.Cell(currCell.id);
                        cell.init(currCell.locationIndex, currCell.label, currCell.tags, currCell.notes);
                        self.cells.push(currCell);
                    }

                    // Parse cell children.
                    // self.cellChildren[i] - list of all children for cell at index i
                    // self.cellChildren[i][j] - jth child of cell i
                    var numChildren = values.cellChildren.length;
                    for (i = 0; i < numChildren; ++i) {
                        var currChildren = values.cellChildren[i];
                        var children = [];
                        for (j = 0; j < currChildren.length; ++j) {
                            var currChild = currChildren[j];
                            var child = new utils.CellChild(currChild.id, currChild.parentId, currChild.label,
                                currChild.tags, currChild.notes, currChild.type, currChild.confidence);
                            children.push(child);
                        }
                        self.cellChildren.push(children);
                    }

                    // Parse cell children locations.
                    // self.cellChildrenLocations[i] - list of list of locations of cell children i
                    // self.cellChildrenLocations[i][j] - list of locations for child j of cell i
                    // self.cellChildrenLocations[i][j][k] - location k for child j or cell i
                    var numChildrenLocations = values.cellChildrenLocations.length;
                    for (i = 0; i < numChildrenLocations; ++i) {
                        numChildren = values.cellChildrenLocations[i].length;
                        var childrenLocations = [];
                        for (var j = 0; j < numChildren; ++j) {
                            var locations = [];
                            var currLocations = values.cellChildrenLocations[i][j];
                            var numLocations = currLocations.length;
                            for (var k = 0; k < numLocations; ++k) {
                                var currLocation = currLocations[k];
                                locations.push(new utils.Location(currLocation.id, currLocation.parentId, currLocation.position.x,
                                    currLocation.position.y, currLocation.position.z, currLocation.radius));
                            }
                            childrenLocations.push(locations);
                        }
                        self.cellChildrenLocations.push(childrenLocations);
                    }

                    // Parse cell child partners. Only two levels of nesting here.
                    var numChildrenPartners = values.cellChildrenPartners.length;
                    for (i = 0; i < numChildrenPartners; ++i) {
                        var numPartners = values.cellChildrenPartners[i].length;
                        var partners = [];
                        for (j = 0; j < numPartners; ++j) {
                            var currPartner = values.cellChildrenPartners[i][j];
                            partners.push(new utils.CellPartner(currPartner.neighborIds, currPartner.childIds, currPartner.bidirectional));
                        }
                        self.cellChildrenPartners.push(partners);
                    }

                    // Parse cell locations. Only two levels of nesting here too.
                    var numCellLocations = values.cellLocations.length;
                    for (i = 0; i < numCellLocations; ++i) {
                        numLocations = values.cellLocations[i].length;
                        locations = [];
                        for (j = 0; j < numLocations; ++j) {
                            currLocation = values.cellLocations[i][j];
                            locations.push(new utils.Location(currLocation.id, currLocation.parentId, currLocation.position.x,
                                currLocation.position.y, currLocation.position.z, currLocation.radius));
                        }
                        self.cellLocations.push(locations);
                        var centroid = getConvexHullFromLocations(locations).centroid();
                        centroid = new utils.Point2D(centroid[0], centroid[1]);
                        self.cellCentroids.push(centroid);
                    }

                    resolve();
                }

                function error(data) {
                    throw('Something went wrong reading data from file' + data);
                }

                $http.get(filename).then(success, error);
            });
        }

        function parseCellData(cellData, requestIds, resolve, reject) {

            var cells = cellData.data.value;
            var requestIdFound = [];

            for (var i = 0; i < requestIds.length; ++i) {
                requestIdFound.push(false);
            }

            for (i = 0; i < cells.length; ++i) {

                var cell = cells[i];

                // Find where to put the incoming cell.
                var index = getCellIndex(cell.ID);
                if (index == -1) {
                    throw('Parsing cell that was not initiated!');
                }

                var requestIndex = requestIds.indexOf(cell.ID);
                requestIdFound[requestIndex] = true;

                // Clean up label.
                if (cell.Label) {
                    cell.Label = cell.Label.trim();
                } else {
                    cell.Label = "null";
                }

                // Copy to new cell.
                var currCell = self.cells[index];
                currCell.init(self.cellLocations.length, cell.Label, cell.Tags, cell.Notes);
            }

            var allCellsReturned = (requestIdFound.indexOf(false) == -1);
            if (allCellsReturned) {
                resolve({validIds: requestIds, invalidIds: []});
            } else {

                var invalidIds = [];

                for (i = 0; i < requestIdFound.length; ++i) {
                    if (!requestIdFound[i]) {
                        invalidIds.push(requestIds[i]);
                        removeCellId(requestIds[i]);
                    }
                }

                for (i = 0; i < requestIdFound.length; ++i) {
                    if (!requestIdFound[i]) {
                        requestIds.splice(i, 1);
                    }
                }

                reject({validIds: requestIds, invalidIds: invalidIds});
            }
        }

        function removeCellId(id) {
            for (var i = 0; i < self.cells.length; ++i) {
                if (self.cells[i].id == id) {
                    self.cells.splice(i, 1);
                    self.cellLocations.splice(i, 1);
                    return;
                }
            }
            throw 'Error - tried to remove cell id that was not loaded yet:' + id;
        }

        function reset() {
            self.cells = [];
            self.cellLocations = [];
            self.cellChildren = [];
            self.cellChildrenLocations = [];
            self.cellChildrenPartners = [];
        }

        function saveAsFile(filename) {

            function getArrayAsJSON(name, value) {
                return "\"" + name + "\":" + JSON.stringify(value);
            }

            var data = ["{\"value\": {" +
            getArrayAsJSON('cells', self.cells) + "," +
            getArrayAsJSON('cellChildren', self.cellChildren) + "," +
            getArrayAsJSON('cellLocations', self.cellLocations) + "," +
            getArrayAsJSON('cellChildrenLocations', self.cellChildrenLocations) + "," +
            getArrayAsJSON('cellChildrenPartners', self.cellChildrenPartners) +
            "}}"];


            var blob = new Blob(data, {type: "text"});
            saveAs(blob, filename);
        }
    }
}());
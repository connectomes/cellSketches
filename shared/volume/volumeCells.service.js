(function () {
    'use strict';

    angular
        .module('app.volumeModule')
        .factory('volumeCells', volumeCells);

    volumeCells.$inject = ['$q', '$http', 'volumeOData'];

    function volumeCells($q, $http, volumeOData) {

        var self = this;
        // Places where data will be stored.
        self.cells = [];
        self.cellLocations = [];
        self.cellChildren = [];
        self.cellChildrenLocations = [];
        self.cellChildrenPartners = [];

        // Constant configurable values
        self.maxCellsInFilter = 15;

        var service = {
            getCell: getCell,
            getCellAt: getCellAt,
            getCellChildAt: getCellChildAt,
            getCellChildLocationsAt: getCellChildLocationsAt,
            getCellChildPartnerAt: getCellChildPartnerAt,
            getCellChildrenByTypeIndexes: getCellChildrenByTypeIndexes,
            getCellIndex: getCellIndex,
            getCellIndexesInLabel: getCellIndexesInLabel,
            getCellLocations: getCellLocations,
            getCellNeighborIndexesByChildType: getCellNeighborIndexesByChildType,
            getCellNeighborLabelsByChildType: getCellNeighborLabelsByChildType,
            getLoadedCellIds: getLoadedCellIds,
            getNumCellChildrenAt: getNumCellChildrenAt,
            getNumCells: getNumCells,
            loadCellChildrenAt: loadCellChildrenAt,
            loadCellId: loadCellId,
            loadCellIds: loadCellIds,
            loadCellLabel: loadCellLabel,
            loadCellLabels: loadCellLabels,
            loadCellNeighborsAt: loadCellNeighborsAt,
            loadCellStartsWith: loadCellStartsWith,
            loadFromFile: loadFromFile,
            removeCellId: removeCellId,
            saveAsFile: saveAsFile
        };

        return service;

        function failure(err) {
            throw err;
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

        function getCellChildrenByTypeIndexes(cellIndex, childType) {

            var cellChildren = self.cellChildren[cellIndex];

            var currChildren = [];

            for (var i = 0; i < cellChildren.length; ++i) {
                if (cellChildren[i].type == childType) {
                    currChildren.push(i);
                }
            }

            return currChildren;
        }

        function getCellChildAt(cellIndex, childIndex) {
            return self.cellChildren[cellIndex][childIndex];
        }

        function getCellChildLocationsAt(cellIndex, childIndex) {
            return self.cellChildrenLocations[cellIndex][childIndex]
        }

        function getCellChildPartnerAt(cellIndex, childIndex) {
            return self.cellChildrenPartners[cellIndex][childIndex];
        }

        function getCellNeighborIndexesByChildType(cellIndex, childType) {

            var childTypeSet = false;
            var children = self.cellChildren[cellIndex];
            var partners = self.cellChildrenPartners[cellIndex];
            var neighbors = []; // to be returned

            if (childType != undefined) {
                childTypeSet = true;
                children = getCellNeighborLabelsByChildType(cellIndex, childType);
            }

            for (var i = 0; i < children.length; ++i) {

                var currChildIndex = i;
                if (childTypeSet) {
                    currChildIndex = children[i];
                }

                var partnerParent = partners[currChildIndex].partnerParent;

                if (partnerParent != -1) {
                    var partnerParentIndex = getCellIndex(partnerParent);
                    neighbors.push(partnerParentIndex);
                }

            }

            return neighbors;
        }

        function getCellNeighborLabelsByChildType(cellIndex, childType) {

            console.log('getting neighbors of cellIndex: ' + cellIndex);
            var neighbors = getCellNeighborIndexesByChildType(cellIndex, childType);
            var labels = [];

            for (var i = 0; i < neighbors.length; ++i) {

                var currNeighbor = getCellAt(neighbors[i]);
                var found = false;

                // If currNeighbor's label is already in labels then add it to the per-label indexes. Else, create a new
                // entry in labels for currNeighbor.
                for (var j = 0; j < labels.length; ++j) {

                    if (labels[j].label == currNeighbor.label) {

                        found = true;

                        if (labels[j].indexes.indexOf(neighbors[i]) == -1) {
                            labels[j].indexes.push(neighbors[i]);
                        }

                        break;
                    }
                }

                if (!found) {
                    labels.push({
                        label: currNeighbor.label,
                        indexes: [neighbors[i]]
                    });
                }
            }

            return labels;
        }

        function getCellIndex(cellId) {

            for (var i = 0; i < self.cells.length; ++i) {
                if (self.cells[i].id == cellId) {
                    return i;
                }
            }

            return -1;
        }

        function getCellIndexesInLabel(label) {
            var indexes = [];

            for (var i = 0; i < self.cells.length; ++i) {
                if (self.cells[i].label == label) {
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
                            continue;
                        }

                        var cellChild = {
                            id: currChild.ID,
                            parentId: currChild.ParentID,  // TODO: remove this.
                            label: currChild.Label,
                            notes: currChild.Notes,
                            tags: currChild.Tags,
                            type: currChild.TypeID
                        };

                        var currChildlocations = [];
                        for (var j = 0; j < currChild.Locations.length; ++j) {

                            var currLocation = currChild.Locations[j];

                            var location = {
                                position: new Point3D(currLocation.VolumeX, currLocation.VolumeY, currLocation.Z),
                                radius: currLocation.Radius,
                                id: currLocation.ID
                            };

                            currChildlocations.push(location);
                        }

                        children.push(cellChild);
                        locations.push(currChildlocations);
                    }
                    self.cellChildren[index] = children;
                    self.cellChildrenLocations[index] = locations;

                    //TODO: assert(self.cellChildren[i].length == self.cellChildrenLocations[i].length)

                    resolve();
                }

                volumeOData.request(request).then(success, failure);
            });
        }

        function loadCellId(id) {

            loadCellIds([id]);

        }

        function loadCellIds(cellIds) {

            var filter = '(';
            var promises = [];
            var numCellsInFilter = 0;

            for (var i = 0; i < cellIds.length; ++i) {

                // Is ID already loaded?
                if (getCellIndex(cellIds[i]) > -1) {
                    continue;
                }

                // This is where the cell gets stored when it gets returned from request.
                var cell = {id: cellIds[i]};
                self.cells.push(cell);

                // Append to the monster filter.
                if (i == 0 || filter === '(') {
                    filter = filter + 'ID eq ' + cellIds[i];
                }

                filter = filter + ' or ID eq ' + cellIds[i];
                numCellsInFilter++;

                // Start request and reset filter.
                if (numCellsInFilter > self.maxCellsInFilter) {
                    filter = filter + ')';
                    promises.push(loadCellIdsFromFilter(filter));
                    filter = '(';
                    numCellsInFilter = 0;
                }
            }

            // Finished all cells, is there anything left in the filter?
            if (numCellsInFilter > 0) {
                filter = filter + ')';
                promises.push(loadCellIdsFromFilter(filter));
            }

            return $q.all(promises);
        }

        function loadCellNeighborsAt(index) {

            var cellId = getCellAt(index).id;

            return $q(function (resolve, reject) {

                var request = 'Structures(' + cellId + ')/Children?$expand=SourceOfLinks($expand=Target($select=ParentID)),TargetOfLinks($expand=Source($select=ParentID))';

                function success(data) {

                    // build list of neighbor ids
                    var values = data.data.value;
                    var partnerIds = [];

                    var orderedPartners = [];

                    for (var i = 0; i < values.length; ++i) {

                        var currPartnerIds = [];
                        var child = -1;
                        var parent = -1;
                        if (values[i].SourceOfLinks.length > 0) {

                            if (values[i].SourceOfLinks[0].hasOwnProperty('Source')) {

                                throw 'Source-to-source link found! Wtf?';

                            } else if (values[i].SourceOfLinks[0].hasOwnProperty('Target')) {

                                parent = values[i].SourceOfLinks[0].Target.ParentID;
                                child = values[i].SourceOfLinks[0].TargetID;

                                if (parent == null || child == null) {
                                    console.log('Warning - cell with id: ' + cellId + ' childid ' + self.cellChildren[index][i]);
                                    console.log('has an invalid target. Removing and ignoring child');
                                    self.cellChildren[index].splice(i, 1);
                                    self.cellChildrenLocations[index].splice(i, 1);
                                } else {
                                    currPartnerIds.push(parent);
                                    orderedPartners.push({partnerParent: parent, partnerIndex: child});
                                }

                            } else {

                                throw 'Source with no targets found! Wtf?';
                            }

                        } else if (values[i].TargetOfLinks.length > 0) {

                            if (values[i].TargetOfLinks[0].hasOwnProperty('Source')) {

                                parent = values[i].TargetOfLinks[0].Source.ParentID;
                                child = values[i].TargetOfLinks[0].SourceID;
                                if (parent == null || child == null) {
                                    console.log('Warning - cell with id: ' + cellId + ' childid ' + self.cellChildren[index][i]);
                                    console.log('has an invalid target. Removing and ignoring child');
                                    self.cellChildren[index].splice(i, 1);
                                    self.cellChildrenLocations[index].splice(i, 1);
                                } else {
                                    currPartnerIds.push(parent);
                                    orderedPartners.push({partnerParent: parent, partnerIndex: child});
                                }

                            } else if (values[i].TargetOfLinks[0].hasOwnProperty('Target')) {

                                throw 'Target-to-target link found! Wtf?';

                            } else {

                                throw 'Target with no found found! Wtf?';
                            }
                        } else {

                            // Child with no source or target.
                            orderedPartners.push({partnerParent: -1, partnerIndex: -1});

                        }

                        for (var j = 0; j < currPartnerIds.length; ++j) {
                            if (partnerIds.indexOf(currPartnerIds[j]) == -1 && currPartnerIds[j] > -1) {
                                partnerIds.push(currPartnerIds[j]);
                            }
                        }

                    }

                    var cellIndex = getCellIndex(cellId);

                    self.cellChildrenPartners[cellIndex] = orderedPartners;

                    loadCellIds(partnerIds).then(function () {
                        resolve();
                    }, failure);
                }

                volumeOData.request(request).then(success, failure);
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

        function loadCellIdsFromFilter(filter) {

            return $q(function (resolve, reject) {

                function success(data) {
                    parseCellData(data);
                    resolve();
                }

                volumeOData.request(('Structures?$filter=' + filter)).then(success, failure);

            });
        }

        function loadFromFile(filename) {

            return $q(function (resolve, reject) {

                function success(data) {

                    var values = data.data.value;
                    self.cells = values.cells;
                    self.cellChildren = values.cellChildren;
                    self.cellChildrenLocations = values.cellChildren;
                    self.cellChildrenPartners = values.cellChildren;

                    resolve();
                }

                function error(data) {
                    console.log('shit');
                    reject();
                }

                $http.get(filename).then(success, error);
            });
        }

        function parseCellData(cellData) {

            var cells = cellData.data.value;

            for (var i = 0; i < cells.length; ++i) {

                var cell = cells[i];

                // Find where to put the incoming cell.
                var index = getCellIndex(cell.ID);
                if (index == -1) {
                    throw('Parsing cell that was not initiated!');
                }

                // Clean up label.
                if (cell.Label) {
                    cell.Label = cell.Label.trim();
                } else {
                    cell.Label = "null";
                }

                // Copy to new cell.
                var currCell = self.cells[index];
                currCell.locations = self.cellLocations.length;
                currCell.label = cell.Label;
                currCell.tags = cell.Tags;
                currCell.notes = cell.Notes;
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
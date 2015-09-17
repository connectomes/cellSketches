(function () {
    'use strict';

    angular
        .module('app.volumeModule')
        .factory('volumeCells', volumeCells);

    volumeCells.$inject = ['$q', 'volumeOData'];

    function volumeCells($q, volumeOData) {

        var self = this;
        self.cells = [];
        self.cellLocations = [];
        self.cellChildren = [];
        self.cellChildrenLocations = [];
        self.cellChildrenPartners = [];

        var service = {
            getCell: getCell,
            getCellAt: getCellAt,
            getCellChildTypeIndexes: getCellChildTypeIndexes,
            getCellIndex: getCellIndex,
            getCellIndexesInLabel: getCellIndexesInLabel,
            getCellLocations: getCellLocations,
            getCellNeighborIndexesByChildType: getCellNeighborIndexesByChildType,
            getCellNeighborLabelsByChildType: getCellNeighborLabelsByChildType,
            getLoadedCellIds: getLoadedCellIds,
            getNumCellChildren: getNumCellChildren,
            loadCellChildrenAt: loadCellChildrenAt,
            loadCellId: loadCellId,
            loadCellIds: loadCellIds,
            loadCellLabel: loadCellLabel,
            loadCellNeighborsAt: loadCellNeighborsAt,
            removeCellId: removeCellId
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

        function getCellChildTypeIndexes(cellIndex, childType) {

            var cellChildren = self.cellChildren[cellIndex];

            var currChildren = [];

            for (var i = 0; i < cellChildren.length; ++i) {
                if (cellChildren[i].type == childType) {
                    currChildren.push(i);
                }
            }

            return currChildren;
        }

        function getCellNeighborIndexesByChildType(cellIndex, childType) {

            var childTypeSet = false;
            var children = self.cellChildren[cellIndex];
            var partners = self.cellChildrenPartners[cellIndex];
            var neighbors = []; // to be returned

            console.log('getCellNeighborIndexesByChildType ' + cellIndex + ' ' + childType);
            console.log('children ');
            console.log(children);
            console.log('partners ');
            console.log(partners);


            if (childType != undefined) {
                childTypeSet = true;
                children = getCellChildTypeIndexes(cellIndex, childType);
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
            throw 'Error - tried to get cell index, but it wasn\'t loaded yet:' + cellId;
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

        function getNumCellChildren(cellId) {
            for (var i = 0; i < self.cells.length; ++i) {
                if (self.cells[i].id == cellId) {
                    return self.cellChildren[i].length;
                }
            }
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

                        var cellChild = {
                            id: currChild.ID,
                            parentId: currChild.ParentID, // TODO: remove this
                            locations: self.cellLocations.length,
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

            return $q(function (resolve, reject) {

                var request = "Structures?$filter=(ID eq " + id + ")";//&$expand=Locations($select=Radius,VolumeX,VolumeY,Z,ParentID,ID)";

                function success(data) {

                    var newCells = data.data.value;
                    if (newCells.length == 0) {
                        reject("Cell " + id + " does not exist!");
                    }

                    for (var i = 0; i < newCells.length; ++i) {

                        var currCell = newCells[i];

                        // Clean up the label (some labels have trailing whitespace).
                        if (currCell.Label) {
                            currCell.Label = currCell.Label.trim();
                        } else {
                            currCell.Label = "null";
                        }

                        var cell = {
                            id: currCell.ID,
                            locations: self.cellLocations.length,
                            label: currCell.Label,
                            notes: currCell.Notes,
                            tags: currCell.Tags
                        };

                        self.cells.push(cell);

                        resolve();
                    }
                }

                volumeOData.request(request).then(success, failure);
            });
        }

        function loadCellIds(cellIds) {

            var promises = [];

            for (var i = 0; i < cellIds.length; ++i) {
                promises[i] = loadCellId(cellIds[i]);
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

                        if (values[i].SourceOfLinks.length > 0) {

                            if (values[i].SourceOfLinks[0].hasOwnProperty('Source')) {

                                throw 'Source-to-source link found! Wtf?';

                            } else if (values[i].SourceOfLinks[0].hasOwnProperty('Target')) {

                                var parent = values[i].SourceOfLinks[0].Target.ParentID;
                                var child = values[i].SourceOfLinks[0].TargetID;
                                if (parent == null || child == null) {
                                    console.log('Warning - cell with id: ' + cellId + ' childid ' + self.cellChildren[index][i]);
                                    console.log('has an invalid target. Removing and ignoring child');
                                    self.cellChildren[index].splice(i, 1);
                                } else {
                                    currPartnerIds.push(parent);
                                    orderedPartners.push({partnerParent: parent, partnerIndex: child});
                                }
                            } else {

                                throw 'Source with no targets found! Wtf?';
                            }

                        } else if (values[i].TargetOfLinks.length > 0) {

                            if (values[i].TargetOfLinks[0].hasOwnProperty('Source')) {

                                var parent = values[i].TargetOfLinks[0].Source.ParentID;
                                var child = values[i].TargetOfLinks[0].SourceID;
                                if (parent == null || child == null) {
                                    console.log('Warning - cell with id: ' + cellId + ' childid ' + self.cellChildren[index][i]);
                                    console.log('has an invalid target. Removing and ignoring child');
                                    self.cellChildren[index].splice(i, 1);
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

                    for (var i = 0; i < cellIds.length; ++i) {
                        promises[i] = loadCellId(cellIds[i].ID);
                    }

                    $q.all(promises).then(function () {
                        resolve();
                    });
                }

                volumeOData.request(request).then(success, failure);
            });

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

    }
}());
(function () {
    'use strict';

    angular
        .module('app.volumeModule')
        .factory('volumeHelpers', volumeHelpers);

    volumeHelpers.$inject = ['volumeCells', 'volumeStructures'];

    function volumeHelpers(volumeCells, volumeStructures) {

        var self = this;

        self.PerChildAttributes = {
            DIAMETER: 0,
            DISTANCE: 1
        };

        self.Units = {
            PIXELS: 0,
            NM: 1
        };

        var service = {
            getChildAttr: getChildAttr,
            getPerChildTargetNames: getPerChildTargetNames,
            getPerChildAttrGroupedByTarget: getPerChildAttrGroupedByTarget
        };

        service.PerChildAttributes = self.PerChildAttributes;
        service.Units = self.Units;

        return service;

        function getChildAttr(cellIndex, childIndex, attribute, units) {
            var value;
            if (attribute == self.PerChildAttributes.DIAMETER) {
                value = volumeCells.getCellChildRadiusAt(cellIndex, childIndex) * 2;
            } else if (attribute == self.PerChildAttributes.DISTANCE) {
                var cellCentroid = volumeCells.getCellCentroidAt(cellIndex);
                var childCentroid = volumeCells.getCellChildCentroidAt(cellIndex, childIndex);
                value = cellCentroid.distance(childCentroid);
            }
            if (units == self.Units.PIXELS) {
                return value;
            } else {
                return value * utils.nmPerPixel;
            }
        }

        function getPerChildTargetNames(cellIndexes, childType, useTargetLabelGroups) {

            var i, j;
            var targets = [];
            var cellIndex, cellPartners, label, group;

            if (!useTargetLabelGroups) {

                // If not using target label groups then return a list of all labels adjacent to cellIndexes.

                for (i = 0; i < cellIndexes.length; ++i) {

                    cellIndex = cellIndexes[i];
                    cellPartners = volumeCells.getCellNeighborLabelsByChildType(cellIndex, childType);

                    for (j = 0; j < cellPartners.length; ++j) {

                        label = cellPartners[j].label;
                        if (targets.indexOf(label) == -1) {
                            targets.push(label);
                        }

                    }

                }

            } else {

                // Using target labels. Return a list of all label groups adjacent to cellIndexes.
                // For each cellIndex, loop over all groups.
                // If cellIndex has children pointing to the current group then add it to the list of targets.

                var targetIndexes = [];

                var numGroups = volumeStructures.getNumGroups();
                for (i = 0; i < cellIndexes.length; ++i) {

                    cellIndex = cellIndexes[i];

                    for (j = 0; j < numGroups; ++j) {

                        var groupIndex = j;
                        var cellChildren = volumeCells.getCellChildrenConnectedToGroupIndex(cellIndex, groupIndex, childType);

                        if (cellChildren.indexes.length > 0) {
                            if (targetIndexes.indexOf(groupIndex) == -1) {
                                targetIndexes.push(groupIndex);
                            }
                        }

                    }

                }

                // Convert indexes back into names.
                targetIndexes.forEach(function (e, i) {
                    targets.push(volumeStructures.getGroupAt(e));
                });

            }

            return targets;
        }

        function getPerChildAttrGroupedByTarget(cellIndexes, childType, useTargetLabelGroups, attribute, units) {

            var results = {};
            results.minValue = Number.MAX_SAFE_INTEGER;
            results.maxValue = 0;
            results.valuesLists = [];
            results.labels = [];

            var targets;
            if (useTargetLabelGroups) {

                targets = getPerChildTargetNames(cellIndexes, childType, useTargetLabelGroups);

                // For each target label...
                targets.forEach(function (target) {

                    var resultsList = [];
                    var groupIndex = volumeStructures.getGroupIndex(target);

                    cellIndexes.forEach(function (cellIndex) {

                        var cellChildren = volumeCells.getCellChildrenConnectedToGroupIndex(cellIndex, groupIndex, childType);

                        cellChildren.indexes.forEach(function (childIndex, i) {

                            var childValue = getChildAttr(cellIndex, childIndex, attribute, units);

                            results.minValue = Math.min(childValue, results.minValue);
                            results.maxValue = Math.max(childValue, results.maxValue);

                            resultsList.push({
                                value: childValue,
                                parentIndex: cellIndex,
                                childIndex: childIndex,
                                partnerIndex: cellChildren.partners[i]
                            });

                        });

                    });

                    results.valuesLists.push(resultsList);
                    results.labels.push(target);

                });

            }
            else {

                targets = getPerChildTargetNames(cellIndexes, childType, useTargetLabelGroups);

                targets.forEach(function (target) {

                    var resultsList = [];
                    var cellsInLabel = volumeCells.getCellIndexesInLabel(target);

                    cellIndexes.forEach(function (cellIndex) {

                        var cellChildren = volumeCells.getCellChildrenConnectedToIndexes(cellIndex, cellsInLabel, childType);

                        cellChildren.indexes.forEach(function (childIndex, i) {

                            var childValue = getChildAttr(cellIndex, childIndex, attribute, units);

                            results.minValue = Math.min(childValue, results.minValue);
                            results.maxValue = Math.max(childValue, results.maxValue);

                            resultsList.push({
                                value: childValue,
                                parentIndex: cellIndex,
                                childIndex: childIndex,
                                partnerIndex: cellChildren.partners[i]
                            });

                        });

                    });

                    results.valuesLists.push(resultsList);
                    results.labels.push(target);

                });
            }
            return results;
        }
    }

}());
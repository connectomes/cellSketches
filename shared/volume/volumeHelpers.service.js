(function () {
    'use strict';

    angular
        .module('app.volumeModule')
        .factory('volumeHelpers', volumeHelpers);

    volumeHelpers.$inject = ['volumeCells', 'volumeStructures', '$log'];

    function volumeHelpers(volumeCells, volumeStructures, $log) {

        var self = this;

        self.PerChildAttributes = {
            DIAMETER: 0,
            DISTANCE: 1,
            CONFIDENCE: 2
        };

        self.Units = {
            PIXELS: 0,
            NM: 1
        };

        var service = {
            createCellChildValues: createCellChildValues,
            getCellChildTargets: getCellChildTargets,
            getChildAttr: getChildAttr,
            getAggregateChildTargetNames: getAggregateChildTargetNames,
            getAggregateChildAttrGroupedByTarget: getChildAttrGroupedByTarget,
            getPerChildAttrGroupedByTypeAndTarget: getPerChildAttrGroupedByTypeAndTarget,
            getMinMaxCount: getMinMaxCount
        };

        service.PerChildAttributes = self.PerChildAttributes;
        service.Units = self.Units;

        return service;

        /**
         * @name createCellChildValues
         * @param cellIndex - parent of current children
         * @param children - indexes of children
         * @returns Array of cell child values with undefined target and values.
         */
        function createCellChildValues(cellIndex, children, attribute) {
            var cellChildValues = [];

            children.forEach(function (child) {
                var value = getChildAttr(cellIndex, child, attribute, self.Units.PIXELS);
                cellChildValues.push(new utils.CellChildValue(cellIndex, child, undefined, value));
            });

            if(attribute != undefined) {
                cellChildValues.forEach(function (value) {
                    if (isNaN(value.value)) {
                        $log.error('Found invalid cell child value: ', value);
                    }
                });
            }

            return cellChildValues;
        }

        function getChildAttr(cellIndex, childIndex, attribute, units) {
            var value;
            if (attribute == self.PerChildAttributes.DIAMETER) {
                value = volumeCells.getCellChildRadiusAt(cellIndex, childIndex) * 2;
            } else if (attribute == self.PerChildAttributes.DISTANCE) {
                var cellCentroid = volumeCells.getCellCentroidAt(cellIndex);
                var childCentroid = volumeCells.getCellChildCentroidAt(cellIndex, childIndex);
                value = childCentroid.distance(cellCentroid);
            } else if (attribute == self.PerChildAttributes.CONFIDENCE) {
                return volumeCells.getCellChildAt(cellIndex, childIndex).confidence;
            }
            if (units == self.Units.PIXELS) {
                return value;
            } else {
                return value * utils.nmPerPixel;
            }
        }

        function getAggregateChildTargetNames(cellIndexes, childType, useTargetLabelGroups) {

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

        /**
         * @name getCellChildTargets
         * @param cellIndexes
         * @param childType
         * @param useTargetLabelGroups
         * @param useOnlySelectedTargets
         * @param selectedTargets
         * @returns List of cell child targets.
         */
        function getCellChildTargets(cellIndexes, childType, useTargetLabelGroups, useOnlySelectedTargets, selectedTargets) {

            var targets;
            if (useOnlySelectedTargets) {
                targets = selectedTargets;
            } else {
                targets = getAggregateChildTargetNames(cellIndexes, childType, useTargetLabelGroups);
            }

            targets.sort(function (a, b) {
                return a.toLowerCase().localeCompare(b.toLowerCase());
            });

            return targets;
        }

        /**
         * @name getChildAttrGroupedByTarget
         * @desc Returns an object {
         *      labels: contains a list of the targets that the children are grouped by
         *      maxValue: computed for all children of all cellIndexes
         *      minValue: same as above
         *      valuesList: [] array of arrays
         *      valuesList[0] - array of Objects representing children that are targeting labels[0]
         *          Objects of valuesList are {
         *             childIndex:
         *             parentIndex:
         *             partnerIndex:
         *          }
         *      These can be converted into neighborIds using: volumeCells.getCellNeighborIdFromChildAndPartner
         * }
         * @param cellIndexes - a list of cells whose children will be aggregated
         * @param childType - int of child type, list of ints, or undefined for all child types
         * @param useTargetLabelGroups - if true then use the groups defined by volume structures, else use labels
         * @param attribute - desired attribute to aggregate, see self.PerChildAttributes
         * @param otherIndexes - list of all cells who will be displayed - this will make sure the targets are uniformly ordered for all cells.
         * @param units - see self.units
         */
        function getChildAttrGroupedByTarget(cellIndexes, childType, useTargetLabelGroups, attribute, units, otherIndexes) {

            var results = {};
            results.minValue = Number.MAX_SAFE_INTEGER;
            results.maxValue = 0;
            results.valuesLists = [];
            results.labels = [];

            var targets = [];
            if (otherIndexes) {
                var allIndexes = angular.copy(otherIndexes);
                allIndexes.push(cellIndexes);
                targets = getAggregateChildTargetNames(allIndexes, childType, useTargetLabelGroups);
            } else {
                targets = getAggregateChildTargetNames(cellIndexes, childType, useTargetLabelGroups);
            }

            if (useTargetLabelGroups) {

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

                            resultsList.push(new utils.CellChildValue(cellIndex, childIndex, cellChildren.partners[i], childValue));

                        });

                    });

                    results.valuesLists.push(resultsList);
                    results.labels.push(target);

                });

            }
            else {

                targets.forEach(function (target) {

                    var resultsList = [];

                    cellIndexes.forEach(function (cellIndex) {

                        var cellsInLabel = volumeCells.getCellIndexesInLabel(target, cellIndex);
                        var cellChildren = volumeCells.getCellChildrenConnectedToIndexes(cellIndex, cellsInLabel, childType);

                        cellChildren.indexes.forEach(function (childIndex, i) {

                            var childValue = getChildAttr(cellIndex, childIndex, attribute, units);

                            results.minValue = Math.min(childValue, results.minValue);
                            results.maxValue = Math.max(childValue, results.maxValue);

                            resultsList.push(new utils.CellChildValue(cellIndex, childIndex, cellChildren.partners[i], childValue));

                        });

                    });

                    results.valuesLists.push(resultsList);
                    results.labels.push(target);

                });
            }

            return results;
        }

        /**
         * @name getMinMaxValues
         * @desc XXX UNTESTED!
         * @param cellIndexes
         * @param childType
         * @param targets
         * @param useTargetLabelGroups
         * @returns {{minCount: number, maxCount: number}}
         */
        function getMinMaxCount(cellIndexes, childType, targets, useTargetLabelGroups) {

            var minCount = 100000;
            var maxCount = -1;

            cellIndexes.forEach(function (cellIndex) {
                var results = getChildAttrGroupedByTarget([cellIndex], childType, useTargetLabelGroups, self.PerChildAttributes.CONFIDENCE, null, cellIndexes);
                results.valuesLists.forEach(function (values, i) {
                    var targetsIndex = targets.indexOf(results.labels[i]);
                    if (targetsIndex != -1) {
                        maxCount = Math.max(maxCount, values.length);
                        minCount = Math.min(minCount, values.length);
                    }
                });
            });

            return {
                minCount: minCount,
                maxCount: maxCount
            };
        }

        /**
         * @name getPerChildAttrGroupedByTypeAndTarget
         * @desc Returns an object similar to the one returned by getChildAttrGroupedByTarget, with the valuesLists
         *       divided by target label AND child type.
         * @param cellIndexes - a list of cells whose children will be aggregated
         * @param childTypes - int of child type, list of ints, or undefined for all child types
         * @param useTargetLabelGroups - if true then use the groups defined by volume structures, else use labels
         * @param attribute - desired attribute to aggregate, see self.PerChildAttributes
         * @param otherIndexes - list of all cells who will be displayed - this will make sure the targets are uniformly ordered for all cells.
         * @param units - see self.units
         */
        function getPerChildAttrGroupedByTypeAndTarget(cellIndexes, childTypes, useTargetLabelGroups, attribute, units, otherIndexes) {

            var resultsByTarget = getChildAttrGroupedByTarget(cellIndexes, childTypes, useTargetLabelGroups, attribute, units, otherIndexes);

            var results = {};
            results.labels = [];
            results.childTypes = [];
            results.valuesLists = [];

            var targets = resultsByTarget.labels;

            targets.forEach(function (target, i) {

                childTypes.forEach(function (childType) {

                    results.labels.push(target);
                    results.childTypes.push(childType);

                    var values = resultsByTarget.valuesLists[i];
                    var newValues = [];

                    values.forEach(function (value) {

                        var child = volumeCells.getCellChildAt(value.cellIndex, value.childIndex);

                        if (child.type == childType) {
                            newValues.push(value);
                        }

                    });

                    results.valuesLists.push(newValues);

                });

            });

            return results;
        }
    }

}());
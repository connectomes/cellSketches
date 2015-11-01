(function () {
    'use strict';

    angular
        .module('app.volumeModule')
        .factory('volumeHelpers', volumeHelpers);

    volumeHelpers.$inject = ['volumeCells', 'volumeStructures'];

    function volumeHelpers(volumeCells, volumeStructures) {

        var self = this;
        self.currentUnits = 'nm';
        self.useTargetLabelGroups = true;

        var service = {
            getPerChildTargetNames: getPerChildTargetNames,
            getPerChildAttrGroupedByTarget: getPerChildAttrGroupedByTarget,
        };

        service.PerChildAttributes = {
            DIAMETER: 0,
            DISTANCE: 1
        };

        return service;

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

                var targetIndexes = [];

                for (i = 0; i < cellIndexes.length; ++i) {

                    cellIndex = cellIndexes[i];
                    cellPartners = volumeCells.getCellNeighborLabelsByChildType(cellIndex, childType);

                    for (j = 0; j < cellPartners.length; ++j) {

                        label = cellPartners[j].label;
                        group = volumeStructures.getGroupOfLabel(label);

                        if (targetIndexes.indexOf(group) == -1) {
                            targetIndexes.push(group);
                        }

                    }

                }

                // Convert indexes back into names.
                targetIndexes.forEach(function (e, i) {
                    targets.push(volumeStructures.getGroupAt(e));
                });

                // Add the self and in-class labels.
                targets.push(volumeStructures.getGroupNameInClass());
                targets.push(volumeStructures.getGroupNameSelf());
            }

            return targets;
        }

        function getPerChildAttrGroupedByTarget(cellIndexes, childType) {

        }

    }

}());
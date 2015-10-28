(function () {
    'use strict';

    angular
        .module('app.volumeModule')
        .factory('volumeStructures', volumeStructures);

    volumeStructures.$inject = ['$q', '$http', 'volumeOData'];

    function volumeStructures($q, $http, volumeOData) {

        var self = this;
        self.structureTypes = [];
        self.childStructureTypeIndexes = [];
        self.labelGroups = {};

        var service = {
            activate: activate,
            activateCellLabelGroups: activateCellLabelGroups,
            getChildStructureTypeAt: getChildStructureTypeAt,
            getChildStructureTypeCodeAt: getChildStructureTypeCodeAt,
            getChildStructureTypeNameAt: getChildStructureTypeNameAt,
            getGroupAt: getGroupAt,
            getGroupOfLabel: getGroupOfLabel,
            getLabelsInGroup: getLabelsInGroup,
            getNumChildStructureTypes: getNumChildStructureTypes,
            getNumGroups: getNumGroups
        };

        return service;

        function activate() {

            var deferred = $q.defer();

            var request = 'StructureTypes';

            function parseResults(data) {

                var structures = data.data.value;

                for (var i = 0; i < structures.length; ++i) {

                    var currStructure = structures[i];

                    var cleanStructure = {
                        id: currStructure.ID,
                        name: currStructure.Name.trim(),
                        code: currStructure.Code,
                        parentId: currStructure.ParentID,
                        color: currStructure.Color
                    };

                    self.structureTypes.push(cleanStructure);

                }

                for (i = 0; i < self.structureTypes.length; ++i) {
                    if (self.structureTypes[i].parentId) {
                        self.childStructureTypeIndexes.push(i);
                    }
                }

                deferred.resolve();
            }

            volumeOData.request(request).then(parseResults);

            return deferred.promise;
        }

        function activateCellLabelGroups() {

            function parseCellLabels(data) {
                self.labelGroups = data.data.values;
            }

            function failedCellLabels(data) {
                console.log('shit!');
            }

            return $http.get('../shared/volume/labelGroups.json').then(parseCellLabels, failedCellLabels)
        }

        function getChildStructureTypeAt(index) {
            return self.structureTypes[self.childStructureTypeIndexes[index]].id;
        }

        function getChildStructureTypeNameAt(index) {
            return self.structureTypes[self.childStructureTypeIndexes[index]].name;
        }

        function getChildStructureTypeCodeAt(index) {
            return self.structureTypes[self.childStructureTypeIndexes[index]].code;
        }

        function getGroupAt(index) {
            return self.labelGroups[index].name;
        }

        function getGroupOfLabel(label) {
            for (var i = 0; i < self.labelGroups.length; ++i) {
                var labels = self.labelGroups[i].labels;
                if (labels.indexOf(label) != -1) {
                    return i;
                }
            }
        }

        function getLabelsInGroup(index) {
            return self.labelGroups[index].labels;
        }

        function getNumChildStructureTypes() {
            return self.childStructureTypeIndexes.length;
        }

        function getNumGroups() {
            return self.labelGroups.length;
        }
    }
}());
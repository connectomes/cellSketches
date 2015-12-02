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

        self.groupNameInClass = 'In Class';
        self.groupNameSelf = 'Self';

        var service = {
            activate: activate,
            getChildStructureIdsFromNames: getChildStructureIdsFromNames,
            getChildStructureTypeAt: getChildStructureTypeAt,
            getChildStructureTypeCodeAt: getChildStructureTypeCodeAt,
            getChildStructureTypeCode: getChildStructureTypeCode,
            getChildStructureTypeNameAt: getChildStructureTypeNameAt,
            getChildStructureTypeName: getChildStructureTypeName,
            getGroupAt: getGroupAt,
            getGroupIndex: getGroupIndex,
            getGroupOfLabel: getGroupOfLabel,
            getGroupIndexInClass: getGroupIndexInClass,
            getGroupIndexSelf: getGroupIndexSelf,
            getGroupNameInClass: getGroupNameInClass,
            getGroupNameSelf: getGroupNameSelf,
            getLabelsInGroup: getLabelsInGroup,
            getNumChildStructureTypes: getNumChildStructureTypes,
            getNumGroups: getNumGroups,
            isLabelInGroup: isLabelInGroup,
            loadStructureTypes: loadStructureTypes,
            loadCellLabelGroups: loadCellLabelGroups
        };

        return service;

        function activate(usingLocal) {
            var promises = [];
            promises.push(loadCellLabelGroups());
            promises.push(loadStructureTypes(usingLocal));
            return $q.all(promises);
        }

        function loadStructureTypes(usingLocal) {

            var deferred = $q.defer();

            var request = 'StructureTypes';

            function parseResults(data) {

                var structures = data.data.value;

                for (var i = 0; i < structures.length; ++i) {

                    var currStructure = structures[i];

                    var cleanStructure = {
                        id: currStructure.ID,
                        name: currStructure.Name.trim(),
                        code: currStructure.Code.trim(),
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

            if(!usingLocal) {
                volumeOData.request(request).then(parseResults);
            } else {
                $http.get('../tests/mock/childStructureTypes.json').then(parseResults);
            }

            return deferred.promise;
        }

        function loadCellLabelGroups() {

            function parseCellLabels(data) {
                self.labelGroups = data.data.values;

                self.labelGroups.push({
                    "name": "In Class",
                    "labels": []
                });

                self.labelGroups.push({
                    "name": "Self",
                    "labels": []
                });
            }

            function failedCellLabels(data) {
                console.log('shit!');
            }

            return $http.get('../shared/volume/labelGroups.json').then(parseCellLabels, failedCellLabels)
        }

        function getChildStructureIdsFromNames(names) {
            var ids = [];
            names.forEach(function(name) {
                for(var i=0; i<getNumChildStructureTypes(); ++i) {
                    if(getChildStructureTypeNameAt(i) == name) {
                        ids.push(getChildStructureTypeAt(i));
                    }
                }
            });
            return ids;
        }

        function getChildStructureTypeAt(index) {
            return self.structureTypes[self.childStructureTypeIndexes[index]].id;
        }

        function getChildStructureTypeNameAt(index) {
            return self.structureTypes[self.childStructureTypeIndexes[index]].name;
        }

        function getChildStructureTypeName(id) {
            for (var i = 0; i < self.childStructureTypeIndexes.length; ++i) {
                var structureIndex = self.childStructureTypeIndexes[i];
                var currStructure = self.structureTypes[structureIndex];
                if (currStructure.id == id) {
                    return currStructure.name;
                }
            }
            throw 'Asked for invalid structure type name';
        }

        function getChildStructureTypeCodeAt(index) {
            return self.structureTypes[self.childStructureTypeIndexes[index]].code;
        }

        function getChildStructureTypeCode(id) {
            for (var i = 0; i < self.childStructureTypeIndexes.length; ++i) {
                var structureIndex = self.childStructureTypeIndexes[i];
                var currStructure = self.structureTypes[structureIndex];
                if (currStructure.id == id) {
                    return currStructure.code;
                }
            }
            throw 'Asked for invalid structure type name ' + id;
        }

        function getGroupAt(index) {
            return self.labelGroups[index].name;
        }

        function getGroupIndex(groupName) {

            for (var i = 0; i < self.labelGroups.length; ++i) {
                if (self.labelGroups[i].name == groupName) {
                    return i;
                }
            }

            return -1;
        }

        function getGroupIndexInClass() {
            return getGroupIndex(self.groupNameInClass);
        }

        function getGroupIndexSelf() {
            return getGroupIndex(self.groupNameSelf);
        }

        function getGroupNameSelf() {
            return self.groupNameSelf;
        }

        function getGroupNameInClass() {
            return self.groupNameInClass;
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
            return angular.copy(self.labelGroups[index].labels);
        }

        function getNumChildStructureTypes() {
            return self.childStructureTypeIndexes.length;
        }

        function getNumGroups() {
            return self.labelGroups.length;
        }

        function isLabelInGroup(label, groupIndex) {
            var labels = self.labelGroups[groupIndex].labels;
            return labels.indexOf(label) != -1;
        }
    }
}());
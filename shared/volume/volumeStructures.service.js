(function () {
    'use strict';

    angular
        .module('app.volumeModule')
        .factory('volumeStructures', volumeStructures);

    volumeStructures.$inject = ['$q', 'volumeOData'];

    function volumeStructures($q, volumeOData) {

        var self = this;
        self.structureTypes = [];
        self.childStructureTypeIndexes = [];

        var service = {
            activate: activate,
            getChildStructureTypeAt: getChildStructureTypeAt,
            getChildStructureTypeCodeAt: getChildStructureTypeCodeAt,
            getChildStructureTypeNameAt: getChildStructureTypeNameAt,
            getNumChildStructureTypes: getNumChildStructureTypes
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
                        name: currStructure.Name,
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
                console.log(self.structureTypes);
                console.log(self.childStructureTypeIndexes);
                deferred.resolve();
            }

            volumeOData.request(request).then(parseResults);

            return deferred.promise;
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

        function getNumChildStructureTypes() {
            return self.childStructureTypeIndexes.length;
        }
    }
}());
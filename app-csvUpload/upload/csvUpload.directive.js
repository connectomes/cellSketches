(function () {
    'use strict';

    angular.module('app.csvUpload')
        .directive('csvUpload', csvUpload);

    function csvUpload() {

        return {
            link: link,
            restrict: 'E',
            templateUrl: 'upload/csvUpload.html',
            controller: controller
        };

        function link(scope, element, attrs) {
            console.log('fuck');
        }

        function controller($scope) {

            $scope.add = function () {
                // Get file to be input
                var file = document.getElementById('file').files[0];
                var reader = new FileReader();
                reader.onloadend = loadEnd;
                reader.readAsArrayBuffer(file);

                function loadEnd(e) {
                    var binary = "";
                    var bytes = new Uint8Array(e.target.result);
                    var length = bytes.byteLength;

                    for (var i = 0; i < length; i++) {
                        binary += String.fromCharCode(bytes[i]);
                    }

                    var input = (binary).toString();
                    var lines = input.split('\n');
                    var sets = [];
                    for (i = 0; i < lines.length; ++i) {
                        var currLine = lines[i].split(',');
                        var name = currLine[0];
                        var cells = [];
                        for (var j = 1; j < currLine.length; ++j) {
                            cells.push(Number(currLine[j]));
                        }
                        sets.push({
                            name: name,
                            cells: cells
                        });
                    }
                    $scope.cellIdsSelected(sets);

                }

            }
        }

    }

})
();
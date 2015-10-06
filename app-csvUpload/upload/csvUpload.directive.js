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

                    // remove whitespace
                    input = input.replace(/(\r\n|\n|\r)/gm, '');

                    input = input.split(',');
                    var cells = [];
                    var numInputs = input.length;
                    for (i = 0; i < numInputs; ++i) {
                        var currId = input[i];
                        cells.push(currId);
                    }

                    $scope.cellIdsSelected(cells);
                }

            }
        }

    }

})
();
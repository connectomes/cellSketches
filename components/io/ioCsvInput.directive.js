(function () {
    'use strict';

    // Note - the controller is named here so we can access it in karma tests.
    angular.module('app.ioModule')
        .directive('ioCsvInput', ioCsvInput)
        .controller('ioCsvInputController', ioCsvInputController);

    function ioCsvInput() {

        return {
            link: link,
            restrict: 'E',
            templateUrl: 'components/io/ioCsvInput.html',
            controller: ioCsvInputController
        };

        function link(scope, element, attrs) {
            // no-op.
        }
    }

    ioCsvInputController.$inject = ['$scope'];

    function ioCsvInputController($scope) {

        var self = this;

        $scope.add = function () {

            // Get file to be input.
            var file = document.getElementById('file').files[0];

            // Create object to read file and set callback.
            var reader = new FileReader();
            reader.onloadend = self.loadEnd;

            // Actually read the file.
            reader.readAsArrayBuffer(file);
        };

        self.loadEnd = function (data) {

            // Read the file as binary data.
            var binary = '';
            var bytes = new Uint8Array(data.target.result);
            var length = bytes.byteLength;
            for (var i = 0; i < length; i++) {
                binary += String.fromCharCode(bytes[i]);
            }

            // Convert to string.
            var input = (binary).toString();

            // Parse results.
            var cells = self.parseCsv(input);

            // Tell scope we're done.
            $scope.loadCells(cells);
        };

        self.parseCsv = function (input) {

            // Split into array, use commas and line breaks as delimeters.
            input = input.replace(/(\r\n|\n|\r)/gm, ',');
            input = input.split(',');

            // Create values as a list of integers.
            var values = [];
            for (var i = 0; i < input.length; ++i) {
                var currValue = parseInt(input[i]);
                if (!isNaN(currValue)) {
                    values.push(currValue);
                }
            }

            return values;
        };
    }
})();
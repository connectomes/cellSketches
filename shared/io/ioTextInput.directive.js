(function () {
    'use strict';

    // Note - the controller is named here so we can access it in karma tests.
    angular.module('app.ioModule')
        .directive('ioTextInput', ioTextInput);

    ioTextInput.$inject = ['$log', 'ioTextParser'];

    function ioTextInput($log, ioTextParser) {

        return {
            link: link,
            restrict: 'E',
            templateUrl: '../shared/io/ioTextInput.html'
        };

        function link(scope, element, attrs) {

            // This is an ugly hack. cellIdsSelected should be passed in to this directives local scope...
            scope.notifyParent = scope.loadCells;

            scope.submit = function(input) {

                $log.debug('ioTextInput - submitted: ' + input);

                var results = ioTextParser.parseString(input);

                $log.debug('ioTextInput - parsed results: ', results);

                if (results.success) {

                    scope.notifyParent(results.values);

                } else {

                    throw results.message;

                }
            }

        }
    }
})();
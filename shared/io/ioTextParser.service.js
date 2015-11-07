(function () {
    'use strict';

    angular
        .module('app.ioModule')
        .factory('ioTextParser', ioTextParser);

    function ioTextParser() {

        var self = this;

        return {
            parseString: parseString
        };

        /**
         * @name parseString
         * @param input - String of space-separated positive integers
         * @returns Object with list of values - the integers
         */
        function parseString(input) {
            input = input.replace('\n', ' ');
            var values = input.split(' ');
            var invalidValues = [];
            var validValues = [];

            values.forEach(function (value) {
                var numericValue = Number(value);
                if (isNaN(numericValue)) {
                    invalidValues.push(value);
                } else if (numericValue < 0) {
                    invalidValues.push(value);
                } else {
                    validValues.push(numericValue);
                }
            });

            var success = invalidValues.length == 0;
            var message = '';

            if (!success) {
                message = "These values are invalid: " + invalidValues;
            }

            return {
                message: message,
                success: success,
                values: validValues
            };
        }
    }

})();

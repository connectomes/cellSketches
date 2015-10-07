(function () {
    'use strict';

    angular.module('app.template')
        .controller('ExampleController', ExampleController);

    // Order here has to match the parameters of the ExampleController function.
    ExampleController.$inject = ['$scope', '$q', 'volumeOData', 'volumeBounds', 'volumeLayers', 'volumeCells', 'volumeStructures'];

    function ExampleController($scope, $q, volumeOData, volumeBounds, volumeLayers, volumeCells, volumeStructures) {

        var self = this;

        function activate() {

            d3.select('body')
                .append('div')
                .html('Hello world');
            
        }

        activate();
    }

})();

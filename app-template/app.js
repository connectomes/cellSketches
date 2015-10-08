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

            var labels = [];

            volumeOData.request("Structures?$filter=(TypeID%20eq%201)&$select=Label").then(parseData);

            function parseData(data) {
                if(data.data["@odata.nextLink"]) {
                    volumeOData.requestComplete(data.data["@odata.nextLink"]).then(parseData);
                }
                var results = data.data.value;
                for(var i=0; i<results.length; ++i) {
                    var currResult = results[i].Label;
                    if(currResult) {
                        currResult = currResult.trim();
                        if (labels.indexOf(currResult) == -1) {
                            labels.push(currResult);
                        }
                    }
                }
                console.log(labels);

                for(var i=0; i<labels.length; ++i) {
                    console.log(labels[i]);
                }

            }
            
        }


        activate();
    }

})();

var myApp = angular.module('formExample', [])

myApp.controller('ExampleController', ['$scope', function ($scope) {

    $scope.master = {};
    $scope.master.name = 6117;
    $scope.results = {};
    $scope.childStructureCount = {};

    $scope.update = function (cell) {
        // Build request for cell
        $scope.master = angular.copy(cell);
        requestURL = serviceURL + "Structures(" + cell.name + "L)\\Children";

        // Try to read. Alert angular of updates to scope.
        OData.read(requestURL, function (data) {
            $scope.$apply(function () {
                $scope.results = angular.copy(data);
            });

            var childStructureCount = new Map();
            for (var i = 0; i < data.results.length; i++) {
                var typeId = structureTypes[data.results[i].TypeID];
                if (typeId in childStructureCount) {
                    childStructureCount[typeId]++;
                } else {
                    childStructureCount[typeId] = 1;
                }
            }

            $scope.$apply(function () {
                $scope.childStructureCount = childStructureCount;
            });

        }, function (err) {
            $scope.$apply(function () {
                $scope.results = err;
            });
        });
    };

    $scope.reset = function () {
        $scope.cell = angular.copy($scope.master);
    };

    $scope.reset();
}]);

myApp.directive('helloD3', function () {

    function link(scope, el, attr) {

        console.log("Hello d3");

        var margin = {top: 20, right: 20, bottom: 30, left: 150},
            width = 960 - margin.left - margin.right,
            height = 300 - margin.top - margin.bottom;

        var yScale = d3.scale.ordinal();
        var xScale = d3.scale.linear();

        var xAxis = d3.svg.axis();
        var yAxis = d3.svg.axis();

        var svg = d3.select(el[0]).append('svg')
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        scope.$watch('childStructureCount', function (childStructureCount) {

            svg.selectAll("*").remove();

            console.log(childStructureCount);

            // Get data ready for d3.
            keys = [];
            values = [];
            for (var i in childStructureCount) {
                keys.push(i);
                values.push(childStructureCount[i]);
            }

            var dataset = d3.zip(keys, values);

            // Update domain and range.
            yScale.domain(dataset.map(function (d) {
                return d[0];
            }))
                .rangeRoundBands([margin.bottom, height], 0.05);

            xScale.domain([0, d3.max(dataset, function (d) {
                return d[1];
            })])
                .range([0, width]);


            xAxis.scale(xScale)
                .orient("bottom");

            yAxis.scale(yScale)
                .orient("left")
                .ticks(5, "");

            svg.append("g")
                .attr("class", "x axis")
                .attr("transform", "translate(0," + height + ")")
                .call(xAxis);

            svg.append("g")
                .attr("class", "y axis")
                .call(yAxis);

            svg.selectAll("rect")
                .data(dataset)
                .enter()
                .append("rect")
                .attr("class", "bar")
                .attr("x", function (d, i) {
                    return 0;
                })
                .attr("y", function (d) {
                    return yScale(d[0]);
                })
                .attr("height", yScale.rangeBand())
                .attr("width", function (d) {
                    return xScale(d[1]);
                });
        });

    }

    return {
        link: link,
        restrict: 'E',
        scope: {
            childStructureCount: '='
        }
    };
});
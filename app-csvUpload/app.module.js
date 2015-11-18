(function () {
    'use strict';

    var app = angular.module('app.csvUpload', ['app.volumeModule', 'ui.router', 'ui.select', 'ngSanitize', 'app.ioModule', 'app.visModule',
        'ui.grid', 'ui.grid.resizeColumns', 'ui.grid.selection', 'ui.grid.cellNav']);

    app.config(function ($stateProvider, $urlRouterProvider) {

        // For any unmatched url, send to /route1
        $urlRouterProvider.otherwise("/route1");

        // The way we set controllers here will actually create new controllers for each of these routes. We use the
        // variable $scope.model to pass information between controllers.
        $stateProvider
            .state('route1', {
                url: "/route1",
                templateUrl: "upload/route1.html",
                controller: 'ExampleController'
            })
            .state('route2', {
                url: "/route2",
                templateUrl: "vis/route2.html",
                controller: 'ExampleController'
            })
            .state('neighborTable', {
                url: "/neighborTable",
                templateUrl: "neighborTable/neighborTable.html",
                controller: 'ExampleController'
            }).state('neighborChart', {
                url: "/neighborChart",
                templateUrl: "neighborChart/neighborChart.html",
                controller: 'ExampleController'
            });
    });
})();
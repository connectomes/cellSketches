(function() {
    'use strict';

    var app = angular.module('app.csvUpload', ['app.volumeModule', 'ui.router', 'ui.select', 'ngSanitize', 'app.ioModule']);

    app.config(function($stateProvider, $urlRouterProvider){

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
    });
})();
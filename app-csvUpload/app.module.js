(function() {
    'use strict';

    var app = angular.module('app.csvUpload', ['app.volumeModule', 'ui.router']);

    app.config(function($stateProvider, $urlRouterProvider){

        // For any unmatched url, send to /route1
        $urlRouterProvider.otherwise("/route1");

        $stateProvider
            .state('route1', {
                url: "/route1",
                templateUrl: "upload/route1.html"
            })
            .state('route2', {
                url: "/route2",
                templateUrl: "vis/route2.html"
            })
    });
})();
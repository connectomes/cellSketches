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

    app.config(function(toastrConfig) {
        angular.extend(toastrConfig, {
            allowHtml: false,
            autoDismiss: false,
            closeButton: true,
            closeHtml: '<button>&times;</button>',
            containerId: 'toast-container',
            extendedTimeOut: 0,
            iconClasses: {
                error: 'toast-error',
                info: 'toast-info',
                success: 'toast-success',
                warning: 'toast-warning'
            },
            maxOpened: 0,
            messageClass: 'toast-message',
            newestOnTop: true,
            onHidden: null,
            onShown: null,
            positionClass: 'toast-top-right',
            preventDuplicates: false,
            preventOpenDuplicates: false,
            progressBar: false,
            tapToDismiss: false,
            target: 'body',
            templates: {
                toast: 'directives/toast/toast.html',
                progressbar: 'directives/progressbar/progressbar.html'
            },
            timeOut: 0,
            titleClass: 'toast-title',
            toastClass: 'toast'
        });
    });
})();
(function () {
    'use strict';

    var app = angular.module('app.csvUpload', [
        'app.volumeModule',
        'app.childrenTableModule',
        'app.iplChartModule',
        'app.loadedCellsModule',
        'app.neighborTableModule',
        'ui.router',
        'ui.select',
        'ngSanitize',
        'app.ioModule',
        'app.visModule',
        'ui.bootstrap',
        'ui.grid',
        'ui.grid.resizeColumns',
        'ui.grid.selection',
        'ui.grid.cellNav',
        'ui.grid.pinning',
        'toastr']);

    app.config(function ($stateProvider, $urlRouterProvider) {

        // For any unmatched url, send to /route1
        $urlRouterProvider.otherwise("/input");

        // The way we set controllers here will actually create new controllers for each of these routes. We use the
        // variable $scope.model to pass information between controllers.
        $stateProvider
            .state('route1', {
                url: "/input",
                templateUrl: "upload/route1.html",
                controller: 'ExampleController'
            }).state('childrenTable', {
                url: "/childrenTable",
                templateUrl: "childrenTable/childrenTable.html",
                controller: 'ExampleController'
            }).state('neighborTable', {
                url: "/table",
                templateUrl: "neighborTable/neighborTable.html",
                controller: 'ExampleController'
            }).state('neighborChart', {
                url: "/neighborChart",
                templateUrl: "neighborChart/neighborChart.html",
                controller: 'ExampleController'
            }).state('iplChart', {
                url: "/iplChart",
                templateUrl: "iplChart/iplChart.html",
                controller: "ExampleController"
            });
        }
    );

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
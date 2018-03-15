(function () {
    'use strict';

    var app = angular.module('app.csvUpload', [
        'app.volumeModule',
        'app.childrenTableModule',
        'app.iplChartModule',
        'app.loadedCellsModule',
        'app.neighborTableModule',
        'app.geometryModule',
        'ui.router',
        'ui.select',
        'ngSanitize',
        'app.ioModule',
        'app.visModule',
        'ui.bootstrap',
        'ui.grid',
        'ui.grid.resizeColumns',
        'ui.grid.cellNav',
        'ui.grid.pinning',
        'ui.grid.moveColumns',
        'ui.grid.saveState',
        'ui.grid.edit',
        'toastr']);

    app.config(function ($stateProvider, $urlRouterProvider) {

        // For any unmatched url, send to /route1
        $urlRouterProvider.otherwise("/input");

        // The way we set controllers here will actually create new controllers for each of these routes. We use the
        // variable $scope.model to pass information between controllers.
        $stateProvider
            .state('route1', {
                url: "/input",
                templateUrl: "components/main/main.html"
            })
            .state('childrenTable', {
                url: "/childrenTable",
                templateUrl: "components/childrenTable/childrenTable.html"
            })
            .state('neighborTable', {
                url: "/table",
                templateUrl: "components/neighborTable/neighborTable.html"
            })
            .state('neighborChart', {
                url: "/neighborChart",
                templateUrl: "components/neighborChart/neighborChart.html"
            })
            .state('iplChart', {
                url: "/iplChart",
                templateUrl: "components/iplChart/iplChart.html"
            })
            .state('geometry', {
                url: "/geometry",
                templateUrl: "components/geometry/geometry.html"
            })
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
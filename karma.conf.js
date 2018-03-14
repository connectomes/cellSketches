module.exports = function (config) {
    config.set({

        basePath: './',

        files: [
            'bower_components/angular/angular.js',
            'bower_components/angular-mocks/angular-mocks.js',
            'bower_components/karma-read-json/karma-read-json.js',
            'bower_components/d3/d3.js',
            'bower_components/angular-toastr/dist/angular-toastr.tpls.js',
            'bower_components/angular-bootstrap/ui-bootstrap-tpls.js',
            'bower_components/three.js/three.js',
            'app/volume/volume.module.js',
            'app/childrenTable/childrenTable.module.js',
            'app/childrenTable/*.js',
            'app/iplChart/iplChart.module.js',
            'app/iplChart/*.js',
            'app/loadedCells/loadedCells.module.js',
            'app/loadedCells/*.service.js',
            'app/neighborTable/neighborTable.module.js',
            'app/neighborTable/*.js',
            'app/utils/utils.js',
            'app/utils/*.js',
            'app/volume/*.js',
            'app/io/io.module.js',
            'app/io/*.js',
            'tests/**/**/*.js',
            {pattern: 'tests/mock/*.json', served: true, included: false},
            {pattern: 'app/volume/labelGroups.json', served: true, included: false},
            {pattern: 'tests/mock/childrenStitching/*.json', served: true, included: false}
        ],

        autoWatch: true,

        frameworks: ['jasmine'],

        browsers: ['Chrome'],

        plugins: [
            'karma-chrome-launcher',
            'karma-jasmine',
            'karma-json'
        ],

        reporters: ['progress']

    });
};

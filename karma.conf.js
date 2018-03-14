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
            'components/volume/volume.module.js',
            'components/childrenTable/childrenTable.module.js',
            'components/childrenTable/*.js',
            'components/iplChart/iplChart.module.js',
            'components/iplChart/*.js',
            'components/loadedCells/loadedCells.module.js',
            'components/loadedCells/*.service.js',
            'components/neighborTable/neighborTable.module.js',
            'components/neighborTable/*.js',
            'components/utils/utils.js',
            'components/utils/*.js',
            'components/volume/*.js',
            'components/io/io.module.js',
            'components/io/*.js',
            'tests/**/**/*.js',
            {pattern: 'tests/mock/*.json', served: true, included: false},
            {pattern: 'components/volume/labelGroups.json', served: true, included: false},
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

module.exports = function (config) {
    config.set({

        basePath: './',

        files: [
            'bower_components/angular/angular.js',
            'bower_components/angular-mocks/angular-mocks.js',
            'bower_components/karma-read-json/karma-read-json.js',
            'shared/utils/utils.js',
            'shared/utils/*.js',
            'shared/volume/volume.module.js',
            'shared/volume/*.js',
            'shared/io/io.module.js',
            'shared/io/*.js',
            'tests/**/**/*.js',
            {pattern: 'tests/mock/*.json', served: true, included: false},
            {pattern: 'tests/mock/childrenStitching/*.json', served: true, included: false}
        ],

        autoWatch: true,

        frameworks: ['jasmine'],

        browsers: ['Chrome'],

        plugins: [
            'karma-chrome-launcher',
            'karma-jasmine',
            'karma-junit-reporter'
        ],

        junitReporter: {
            outputFile: 'test_out/unit.xml',
            suite: 'unit'
        }

    });
};

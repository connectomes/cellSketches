(function () {
    'use strict';

    angular.module('app.volumeModule')
        .factory('testService', testService);

    function testService() {

        var service = {
            hello: hello,
            shit: "FUCK FUCK FUCK"
        };

        return service;

        function hello() {
            console.log("hello");
        }
    }

}());

describe('ioTextParser', function () {
    'use strict';

    var ioTextParser;

    // Testing setup
    beforeEach(function () {
        module('app.ioModule');
    });

    beforeEach(inject(function (_ioTextParser_) {
        ioTextParser = _ioTextParser_;
    }));

    it('parseString - correct', function() {
        var results = ioTextParser.parseString('1 2 34\n5');

        expect(results.success).toBeTruthy();

        var expectedResults = [1, 2, 34, 5];
        expectedResults.forEach(function(e, i) {
           expect(results.values[i] == e).toBeTruthy();
        });
    });

    it('parseString - negative number', function() {
        var results = ioTextParser.parseString('1 2 -34\n5');
        expect(results.success == false).toBeTruthy();
        expect(results.message == 'These values are invalid: -34').toBeTruthy();
    });

    it('parseString - non-number', function() {
        var results = ioTextParser.parseString('1 b -34\n14a');
        expect(results.success == false).toBeTruthy();
        expect(results.message == 'These values are invalid: b,-34,14a').toBeTruthy();
    });
});
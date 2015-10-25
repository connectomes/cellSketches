describe('VolumeStructures service test', function () {

    var $controller;

    beforeEach(function () {
        module('app.ioModule');

    });

    beforeEach(inject(function(_$controller_){
        // The injector unwraps the underscores (_) from around the parameter names when matching
        $controller = _$controller_;

    }));

    it('Testing csv parsing', function() {

        // Compile a piece of HTML containing the directive
        var $scope = {};
        var controller = $controller('ioCsvInputController', { $scope: $scope });

        var test = '6117,';
        var values = controller.parseCsv(test);
        expect(values[0] == 6117).toBeTruthy();

        test = '6117, 504';
        values = controller.parseCsv(test);
        expect(values[0] == 6117).toBeTruthy();
        expect(values[1] == 504).toBeTruthy();
        expect(values.length == 2).toBeTruthy();

        test = '6117, \n504';
        values = controller.parseCsv(test);
        expect(values[0] == 6117).toBeTruthy();
        expect(values[1] == 504).toBeTruthy();
        expect(values.length == 2).toBeTruthy();

        test = '6117, \n\n504';
        values = controller.parseCsv(test);
        expect(values[0] == 6117).toBeTruthy();
        expect(values[1] == 504).toBeTruthy();
        expect(values.length == 2).toBeTruthy();

        test = '6117\n504';
        values = controller.parseCsv(test);
        expect(values.length == 2).toBeTruthy();
        expect(values[0] == 6117).toBeTruthy();
        expect(values[1] == 504).toBeTruthy();
    });

});
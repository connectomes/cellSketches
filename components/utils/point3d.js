utils.Point3D = (function () {
    'use strict';

    function Point3D(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    Point3D.prototype.toString = function () {
        var self = this;
        return '(' + self.x + ', ' + self.y + ', ' + self.z + ')';
    };

    Point3D.prototype.multiply = function (rhs) {
        var self = this;
        if (rhs.hasOwnProperty('x') && rhs.hasOwnProperty('y') && rhs.hasOwnProperty('z')) {
            return new Point3D(rhs.x * self.x, rhs.y * self.y, rhs.z * self.z);
        } else {
            return new Point3D(rhs * self.x, rhs * self.y, rhs * self.z);
        }
    };

    Point3D.prototype.add = function (rhs) {
        var self = this;
        return new Point3D(rhs.x + self.x, rhs.y + self.y, rhs.z + self.z);
    };

    Point3D.prototype.distance = function (rhs) {
        var self = this;
        return Math.sqrt(Math.pow((self.x - rhs.x), 2) + Math.pow((self.y - rhs.y), 2) + Math.pow((self.z - rhs.z), 2));
    };

    Point3D.prototype.getAs2D = function() {
        var self = this;
        return new utils.Point2D(self.x, self.y);
    };

    return Point3D;

})();
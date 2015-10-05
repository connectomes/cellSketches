utils.Point2D = (function () {
    'use strict';

    function Point2D(x, y) {
        var self = this;
        self.x = x;
        self.y = y;
    }

    Point2D.prototype.multiply = function (rhs) {
        var self = this;
        if (rhs.hasOwnProperty('x') && rhs.hasOwnProperty('y')) {
            return new Point2D(rhs.x * self.x, rhs.y * self.y);
        } else {
            return new Point2D(self.x * rhs, self.y * rhs);
        }
    };

    Point2D.prototype.add = function (rhs) {
        var self = this;
        return new Point2D(rhs.x + self.x, rhs.y + self.y);
    };

    Point2D.prototype.toString = function () {
        var self = this;
        return '(' + self.x + ', ' + self.y + ')';
    };

    Point2D.prototype.distance = function (rhs) {
        var self = this;
        return Math.sqrt(Math.pow((self.x - rhs.x), 2) + Math.pow((self.y - rhs.y), 2));
    };

    return Point2D;
})();
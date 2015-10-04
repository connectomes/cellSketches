utils.Point2D = (function () {
    function Point2D(x, y) {
        var self = this;
        self.x = x;
        self.y = y;
    }

    Point2D.prototype.multiply = function (rhs) {
        var self = this;
        return new Point2D(rhs.x * self.x, rhs.y * self.y);
    };

    Point2D.prototype.add = function (rhs) {
        var self = this;
        return new Point2D(rhs.x + self.x, rhs.y + self.y);
    };

    Point2D.prototype.toString = function () {
        var self = this;
        return '(' + self.x + ', ' + self.y + ')';
    };

    return Point2D;
})();
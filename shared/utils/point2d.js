function Point2D(x, y) {

    var self = this;
    self.x = x;
    self.y = y;

    self.multiply = function (rhs) {
        return new Point2D(rhs.x * self.x, rhs.y * self.y);
    };

    self.add = function(rhs) {
        return new Point2D(rhs.x + self.x, rhs.y + self.y);
    };

    self.toString = function () {
        return '(' + self.x + ', ' + self.y + ')';
    };
}
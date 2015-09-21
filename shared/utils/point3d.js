function Point3D(x, y, z) {

    var self = this;
    self.x = x;
    self.y = y;
    self.z = z;

    self.toString = function() {
        return '(' + self.x + ', ' + self.y + ', ' + self.z + ')';
    };

    self.multiply = function (rhs) {
        return new Point2D(rhs.x * self.x, rhs.y * self.y, rhs.z * self.z);
    };

    self.add = function(rhs) {
        return new Point2D(rhs.x + self.x, rhs.y + self.y, rhs.z + self.z);
    };
}
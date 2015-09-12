function Point3D(x, y, z) {

    var self = this;
    self.x = x;
    self.y = y;
    self.z = z;

    self.toString = function() {
        return '(' + self.x + ', ' + self.y + ', ' + self.z + ')';
    }
}
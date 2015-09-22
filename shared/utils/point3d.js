function Point3D(x, y, z) {

    var self = this;
    self.x = x;
    self.y = y;
    self.z = z;

    self.toString = function() {
        return '(' + self.x + ', ' + self.y + ', ' + self.z + ')';
    };

    self.multiply = function (rhs) {
        if(rhs.hasOwnProperty('x') && rhs.hasOwnProperty('y') && rhs.hasOwnProperty('z')) {
            return new Point3D(rhs.x * self.x, rhs.y * self.y, rhs.z * self.z);
        } else {
            return new Point3D(rhs * self.x, rhs * self.y, rhs * self.z);
        }
    };

    self.add = function(rhs) {
        return new Point3D(rhs.x + self.x, rhs.y + self.y, rhs.z + self.z);
    };

    self.distance = function(rhs) {
        return Math.sqrt(Math.pow((self.x - rhs.x), 2) + Math.pow((self.y - rhs.y), 2) + Math.pow((self.z - rhs.z), 2));
    }

}
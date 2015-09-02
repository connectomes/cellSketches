/**
 * Created by kerzner on 9/2/2015.
 */

function Point3D(x, y, z) {

    var self = this;
    self.x = x;
    self.y = y;
    self.z = z;

    self.toString = function() {
        return '(' + self.x + ', ' + self.y + ', ' + self.z + ')';
    }
}
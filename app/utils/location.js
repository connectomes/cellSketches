utils.Location = (function () {
    'use strict';

    function Location(id, parentId, volumeX, volumeY, z, radius) {
        var self = this;
        self.id = id;
        self.parentId = parentId;
        self.position = new utils.Point3D(volumeX, volumeY, z);
        self.radius = radius;
    }

    return Location;
})();
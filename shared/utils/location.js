function Location(odataLocation) {
    var self = this;

    self.id = odataLocation.ID;
    self.parentId = odataLocation.ParentID;
    self.position = new utils.Point3D(odataLocation.VolumeX, odataLocation.VolumeY, odataLocation.Z);

    return self;
}
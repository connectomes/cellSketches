function getTriangleArea(triangle) {
    var p0 = triangle[0];
    var p1 = triangle[1];
    var p2 = triangle[2];
    var area = ((p1[0] - p0[0])*(p2[1]-p0[1]) - (p2[0] - p0[0])*(p1[1] - p0[1])) / 2;
    return area > 0 ? area : -area;
}

// Compute delaunay triangulation of points
// Compute area of each triangle
// Return sum of areas
function areaOfConvexHull(vertices) {
    var triangles = d3.geom.delaunay(vertices);
    var area = 0;
    for (var i = 0; i < triangles.length; ++i) {
        var triangle = triangles[i];
        area = area + getTriangleArea(triangle);
    }
    return area;
}
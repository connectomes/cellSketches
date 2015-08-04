/**
 * Copyright (c) Ethan Kerzner 2015
 */

var serviceURL = "http://websvc1.connectomes.utah.edu/RC1/OData/ConnectomeData.svc/";
OData.defaultHttpClient.enableJsonpCallback = true;

var getData = function(requestURL, callback) {
    OData.read(requestURL, callback, function(err) {
        console.log("Warning - query failed " + err);
    })
};

var getStructureMap = function() {
    // Create url to request structure ids.
    var requestURL = serviceURL + "StructureTypes";
    var structureTypes = Object();

    // Build map of structure
    var structureMap = d3.map();
    getData(requestURL, function(data) {
        for (var i = 0; i < data.results.length; i++) {
            var currName = data.results[i].Name;
            var currValue = data.results[i].ID;
            structureMap.set(currValue, currName);
        }
    });
    console.log(structureMap);

    return structureMap;
};
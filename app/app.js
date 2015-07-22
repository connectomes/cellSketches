
requestOdataFromURL = function(url) {
    return OData.read(requestURL, function(data) {
        return data;
    }, function (err) {
        console.log(err);
        return null;
    });
};
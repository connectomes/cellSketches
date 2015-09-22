//http://bl.ocks.org/mbostock/3048450
function Histogram(group, inputData, title, height, width, xAxisDomain, callback) {

    var values = d3.range(1000).map(d3.random.bates(10));

// A formatter for counts.
    var formatCount = d3.format(",.0f");

    var margin = {top: 10, right: 30, bottom: 30, left: 30},
        width = width - margin.left - margin.right,
        height = height - margin.top - margin.bottom;

    var x = d3.scale.linear()
        .domain(xAxisDomain)
        .range([0, width - margin.right]);

    var distances = inputData[0].children.map(function (d) {
        return d.distance;
    });

    // Generate a histogram using twenty uniformly-spaced bins.
    var data = d3.layout.histogram()
        .range(xAxisDomain)
        .bins(x.ticks(10))
    (distances);

    var yDomain = [0, d3.max(data, function (d) {
        return d.y;
    })];

    var y = d3.scale.linear()
        .domain(yDomain)
        .range([height, 0]);

    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom")
        .ticks(1);

    var yAxis = d3.svg.axis()
        .scale(y)
        .orient('left').tickFormat(function (d) {
            if ((d % 1) == 0) {
                return d;
            } else {
                return "";
            }
        }
    );

    group.append('g')
        .attr({
            transform: 'translate(' + margin.right + ', 0)',
            'font-size': '9px'
        })
        .call(yAxis);

    var svg = group.append('g').attr({
        transform: 'translate(' + margin.right + ',0)'
    });

    var bar = svg.selectAll(".bar")
        .data(data)
        .enter().append("g")
        .attr("class", "bar")
        .attr("transform", function (d) {
            return "translate(" + x(d.x) + "," + y(d.y) + ")";
        });

    bar.append("rect")
        .attr("x", 1)
        .attr("width", x(data[0].dx) - 1)
        .attr("y", function (d) {
            return -2;
        })
        .attr('height', 2)
        .attr('fill', 'steelblue');

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);
}
function customAxis(g) {
    g.selectAll("text")
        .attr("x", -2)
        .attr("dy", 3);
}

function BarChart(group, data, title, height, width) {
    var self = this;
    var paddingLeftPercent = 0.15;
    var paddingBottomPercent = 0.25;
    var paddingTopPercent = 0.025;
    var paddingVertical = paddingTopPercent + paddingBottomPercent;
    self.yScale = d3.scale.ordinal();
    self.xScale = d3.scale.linear();

    self.xAxis = d3.svg.axis();
    self.yAxis = d3.svg.axis();

    self.title = group.append('g')
        .attr({
            transform: 'translate(0, 5)'
        })
        .append('text')
        .text(title)
        .style({
            'font-size': '12px'
        });
    self.bars = group.append('g');

    self.yScale
        .domain(data.map(function (d) {
            return d.name;
        })).rangeBands([height * paddingTopPercent, height * (1 - paddingVertical)]);

    self.xScale
        .domain([0, 10])
        .range([0, width * (1 - paddingLeftPercent)]);

    self.xAxis.scale(self.xScale)
        .orient('bottom');

    group.append('g')
        .attr({
            transform: 'translate(' + (paddingLeftPercent * width) + ', ' + (height - (height * paddingVertical)) + ')',
            'font-size': '9px'
        }).call(self.xAxis);

    self.yAxis
        .scale(self.yScale)
        .orient('left');

    group.append('g')
        .attr({
            transform: 'translate(' + (paddingLeftPercent * width) + ', 0)',
            'font-size': '9px'
        })
        .call(self.yAxis).call(customAxis);

    self.bars.selectAll('.bar')
        .data(data)
        .enter()
        .append('rect')
        .attr('y', function (d) {
            return self.yScale(d.name);
        })
        .attr('x', width * paddingLeftPercent)
        .attr('width', function (d) {
            return self.xScale(d3.max([0, d.value]));
        })
        .attr('height', function (d) {
            return self.yScale.rangeBand();
        })
        .attr('fill', function (d) {
            return 'steelblue';
        });
}
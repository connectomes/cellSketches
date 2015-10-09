function BarChart(group, data, title, height, width, xAxisMax, callback) {

    var self = this;
    self.paddingLeftPercent = 0.15;
    self.paddingBottomPercent = 0.10;
    self.paddingTopPercent = 0.025;

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
        })).rangeBands([height * self.paddingTopPercent, height * (1 - self.paddingBottomPercent)]);

    self.xScale
        .domain([0, xAxisMax])
        .range([0, width * (1 - self.paddingLeftPercent)]);

    self.xAxis.scale(self.xScale)
        .orient('bottom');

    group.append('g')
        .attr({
            transform: 'translate(' + (self.paddingLeftPercent * width) + ', ' + (height - (height * self.paddingBottomPercent)) + ')',
            'font-size': '9px'
        }).call(self.xAxis);

    self.yAxis
        .scale(self.yScale)
        .orient('left');

    group.append('g')
        .attr({
            transform: 'translate(' + (self.paddingLeftPercent * width) + ', 0)',
            'font-size': '9px'
        })
        .call(self.yAxis).call(customAxis);

    self.bars.selectAll('.bar')
        .data(data)
        .enter()
        .append('rect')
        .attr('class', 'bar')
        .attr('y', function (d) {
            return self.yScale(d.name);
        })
        .attr('x', width * self.paddingLeftPercent)
        .attr('width', function (d) {
            return self.xScale(d3.max([0, d.value]));
        })
        .attr('height', function (d) {
            return self.yScale.rangeBand();
        }).on('click', callback);

    // TODO: Put this somewhere else.
    function customAxis(g) {
        g.selectAll("text")
            .attr("x", -2)
            .attr("dy", 3);
    }
}
(function() {
    d3.chart('BarChart', {
        initialize : function() {
            this.yScale  = d3.scale.ordinal();
            this.xScale  = d3.scale.linear();
            this._color  = d3.scale.category10();

            this._width = this._width || this.base.attr('width') || 200;
            this._height = this._height || this.base.attr('height') || 100;

            var barsLayerBase = this.base.append('g')
                .classed('bars', true);

            this.layer('bars', barsLayerBase, {

                dataBind: function(data) {
                    var chart = this.chart();

                    // Update the x-scale.
                    chart.yScale.domain(data.map(function(d) { return d.name; }));

                    // Update the y-scale.
                    chart.xScale.domain([
                        d3.min(data, function(d) { return d3.min([d.value, 0]); }),
                        d3.max(data, function(d) { return d.value; })
                    ]);

                    console.log(chart.xScale.domain());

                    return this.selectAll('.bar')
                        .data(data);

                },

                insert: function() {
                    var chart = this.chart();

                    // Append the bars
                    return this.append('rect')
                        .attr('fill', 'blue')
                        .attr('width', chart.yScale.rangeBand());
                },

                events: {
                    enter: function() {
                        var chart = this.chart();

                        return this
                            .attr('y', function(d) { return chart.yScale(d.name); })
                            .attr('x', 0)
                            .attr('width', function(d) { return chart.xScale(d3.max([0, d.value])); })
                            .attr('height', function(d) { return chart.yScale.rangeBand(); })
                            .attr('fill', function(d) {return 'steelblue'; });
                    }
                }

            });
        },

        width: function(newWidth) {
            if (arguments.length === 0) {
                return this._width;
            }
            this._width = newWidth;
            this.base.attr('width', this._width);

            this.xScale.range([0, newWidth]);

            return this;
        },

        height: function(newHeight) {
            if (arguments.length === 0) {
                return this._height;
            }
            this._height = newHeight;
            this.base.attr('height', this._height);
            this.yScale.rangeRoundBands([0, newHeight], 0.1);
            return this;
        },

        xAxisLabel: function(label) {
            console.log(label);
            return this;
        },

        yAxisLabels: function(labels) {
            console.log(labels);
        }

    });
}());
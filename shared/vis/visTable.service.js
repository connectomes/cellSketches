(function () {
    'use strict';

    angular
        .module('app.visModule')
        .factory('visTable', visTable);

    visTable.$inject = ['$log'];

    function visTable($log) {

        return {
            TableD3: TableD3
        };

        function TableD3() {
            var self = this;
            self.fieldHeight = 20;
            self.fieldWidth = 65;
            self.rows = {};
            self.previousSort = -1;

            return {
                activate: activate
            };

            function activate(headerData, rowData, group) {
                createHeader(headerData, group);
                createRows(rowData, group);
            }

            function createHeader(headerData, group) {

                var headerGroup = group.append("g")
                    .attr("class", "headerGroup");

                var header = headerGroup.selectAll("g")
                    .data(headerData)
                    .enter()
                    .append("g")
                    .attr("class", "header")
                    .attr("transform", function (d, i) {
                        return "translate(" + i * self.fieldWidth + ",0)";
                    })
                    .on("click", function (d, i) {
                        return sortOnColumn(i);
                    });

                header.append("rect")
                    .attr("width", self.fieldWidth - 1)
                    .attr("height", self.fieldHeight);

                header.append("text")
                    .attr("x", self.fieldWidth / 2)
                    .attr("y", self.fieldHeight / 2)
                    .attr("dy", ".35em")
                    .text(function (d) {
                        return d;
                    });
            }

            function createRows(rowData, group) {

                var rowsGroup = group.append("g")
                    .attr("class", "rowsGroup");

                self.rows = rowsGroup.selectAll(".row")
                    .data(rowData, function (d) {
                        return d[0];
                    })
                    .enter()
                    .append("g")
                    .attr("class", "row")
                    .attr("transform", function (d, i) {
                        return "translate(0," + (i + 1) * (self.fieldHeight + 1) + ")";
                    });


                var tableCells = self.rows.selectAll('.cell')
                    .data(function (d) {
                        $log.debug('table cells data', d);
                        return d;
                    })
                    .enter()
                    .append('g')
                    .attr("class", "cell")
                    .attr("transform", function (d, i) {
                        return "translate(" + i * self.fieldWidth + ",0)";
                    });

                tableCells.append("rect")
                    .attr("width", self.fieldWidth - 1)
                    .attr("height", self.fieldHeight);

                tableCells.append("text")
                    .attr("x", self.fieldWidth / 2)
                    .attr("y", self.fieldHeight / 2)
                    .attr("dy", ".35em")
                    .text(function (d, i) {
                        if (i == 0) {
                            return Number(d);
                        } else if (i == 1) {
                            return d;
                        } else {
                            return d.length;
                        }
                    });
            }

            function sortOnColumn(column) {
                $log.debug('sorting...', column);
                if (column != self.previousSort) {
                    self.rows.sort(function (a, b) {
                        return sort(a[column], b[column]);
                    });
                    self.previousSort = column;
                }
                else {
                    self.rows.sort(function (a, b) {
                        return sort(b[column], a[column]);
                    });
                    self.previousSort = null;
                }
                self.rows.transition()
                    .duration(500)
                    .attr("transform", function (d, i) {
                        return "translate(0," + (i + 1) * (self.fieldHeight + 1) + ")";
                    });
            }

            function sort(a, b) {
                $log.debug(typeof a);
                if (typeof a == "string") {
                    return a.localeCompare(b);
                }
                else if (typeof a == "number") {
                    return a > b ? 1 : a == b ? 0 : -1;
                }
                else if (typeof a == "boolean") {
                    return b ? 1 : a ? -1 : 0;
                } else if (typeof a == "object") {
                    return a.length > b.length ? 1 : a.length == b.length ? 0 : -1;
                }
            }

        }
    }

}());
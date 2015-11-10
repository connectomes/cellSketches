(function () {
    'use strict';

    angular.module('app.csvUpload')
        .directive('neighborBarChart', neighborBarChart);

    neighborBarChart.$inject = ['$log', 'volumeCells', 'volumeStructures', 'volumeHelpers', 'visUtils'];

    function neighborBarChart($log, volumeCells, volumeStructures, volumeHelpers, visUtils) {

        return {
            link: link,
            restrict: 'E'
        };

        function link(scope, element, attribute) {
            var self = {};

            $log.debug('neighborBarChart - link');

            self.svg = visUtils.createSvg(element[0]);
            self.mainGroup = visUtils.createMainGroup(self.svg);
            self.detailsGroup = visUtils.createDetailsGroup(self.svg);
            scope.$on('cellsChanged', cellsChanged);

            self.numSmallMultiplesPerRow = 6;
            self.smallMultiplePadding = 10;
            self.smallMultipleWidth = (visUtils.getSvgWidth() - (self.numSmallMultiplesPerRow * self.smallMultiplePadding)) / self.numSmallMultiplesPerRow;
            self.smallMultipleHeight = 200;
            self.smallMultipleOffsets = new utils.Point2D(self.smallMultiplePadding + self.smallMultipleWidth, self.smallMultiplePadding + self.smallMultipleHeight);
            scope.broadcastChange();

            function cellsChanged(slot, cells, childType, useTargetLabelGroups, useOnlySelectedTargets, selectedTargets, convertToNm, useRadius) {
                $log.debug('neighborBarChart - cells changed');
                $log.debug(' cellIndexes', cells);
                $log.debug(' childType', childType);
                $log.debug(' useTargetLabelGroups', useTargetLabelGroups);
                $log.debug(' useOnlySelectedTargets', useOnlySelectedTargets);
                $log.debug(' selectedTargets', selectedTargets);
                $log.debug(' convertToNm', convertToNm);
                $log.debug(' useRadius', convertToNm);
                $log.debug(' convertToNm', useRadius);

                var cellIndexes = cells.indexes;

                visUtils.clearGroup(self.mainGroup);

                var targets;
                if (!useOnlySelectedTargets) {
                    targets = selectedTargets;
                } else {
                    targets = volumeHelpers.getAggregateChildTargetNames(cellIndexes, childType, useTargetLabelGroups);
                }

                var headerData = ['id', 'label'];
                headerData = headerData.concat(targets);

                var tableData = [];
                var maxCount = -1;
                var minCount = 10000;

                cellIndexes.forEach(function (cellIndex) {
                    var results = volumeHelpers.getAggregateChildAttrGroupedByTarget([cellIndex], childType, useTargetLabelGroups, volumeHelpers.PerChildAttributes.CONFIDENCE, null, cellIndexes);
                    var rowData = [];
                    rowData.push(volumeCells.getCellAt(cellIndex).id);
                    rowData.push(volumeCells.getCellAt(cellIndex).label);
                    results.valuesLists.forEach(function (values, i) {
                        var targetsIndex = targets.indexOf(results.labels[i]);
                        if (targetsIndex != -1) {
                            // Align rowData with targets
                            // Offset by 2 b/c rowData[0] and rowData[1] are already taken by cell id and label
                            rowData[targetsIndex + 2] = values;
                            maxCount = Math.max(maxCount, values.length);
                            minCount = Math.min(minCount, values.length);
                        }
                    });
                    tableData.push(rowData);
                });
                $log.debug(headerData);
                $log.debug(tableData);
                $log.debug(targets);


                var previousSort = null;


                updateTable(-1);

                function updateTable(sortOn) {

                    var fieldHeight = 20;
                    var fieldWidth = 65;

                    self.headerGroup = self.mainGroup.append("g")
                        .attr("class", "headerGroup");

                    self.rowsGroup = self.mainGroup
                        .append("g").attr("class", "rowsGroup");

                    var header = self.headerGroup.selectAll("g")
                        .data(headerData)
                        .enter()
                        .append("g")
                        .attr("class", "header")
                        .attr("transform", function (d, i) {
                            return "translate(" + i * fieldWidth + ",0)";
                        })
                        .on("click", function (d, i) {
                            return sortFunction(i);
                        });

                    header.append("rect")
                        .attr("width", fieldWidth - 1)
                        .attr("height", fieldHeight);

                    header.append("text")
                        .attr("x", fieldWidth / 2)
                        .attr("y", fieldHeight / 2)
                        .attr("dy", ".35em")
                        .text(function (d) {
                            return d;
                        });

                    // Each row is a group with data assigned to it.
                    var rows = self.rowsGroup.selectAll(".row")
                        .data(tableData, function (d) {
                            return d[0];
                        })
                        .enter()
                        .append("g")
                        .attr("class", "row")
                        .attr("transform", function (d, i) {
                            return "translate(0," + (i + 1) * (fieldHeight + 1) + ")";
                        });


                    var tableCells = rows.selectAll('.cell')
                        .data(function (d) {
                            $log.debug('table cells data', d);
                            return d;
                        })
                        .enter()
                        .append('g')
                        .attr("class", "cell")
                        .attr("transform", function (d, i) {
                            return "translate(" + i * fieldWidth + ",0)";
                        });

                    tableCells.append("rect")
                        .attr("width", fieldWidth - 1)
                        .attr("height", fieldHeight);

                    tableCells.append("text")
                        .attr("x", fieldWidth / 2)
                        .attr("y", fieldHeight / 2)
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

                    function sortFunction(sortOn) {
                        $log.debug('sorting...', sortOn);
                        if (sortOn != previousSort) {
                            rows.sort(function (a, b) {
                                return sort(a[sortOn], b[sortOn]);
                            });
                            previousSort = sortOn;
                        }
                        else {
                            rows.sort(function (a, b) {
                                return sort(b[sortOn], a[sortOn]);
                            });
                            previousSort = null;
                        }
                        rows.transition()
                            .duration(500)
                            .attr("transform", function (d, i) {
                                return "translate(0," + (i + 1) * (fieldHeight + 1) + ")";
                            });
                    }
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

                /*
                 d3.select(element[0]).selectAll('div').remove();

                 d3.select(element[0]).append('div').html('<h4>cell indexes</h4>');
                 d3.select(element[0]).append('div').html(cells.ids);

                 d3.select(element[0]).append('div').html('<h4>selected labels</h4>');

                 if (!useOnlySelectedTargets) {
                 d3.select(element[0]).append('div').html(selectedTargets);
                 } else {
                 d3.select(element[0]).append('div').html('using all targets');
                 }

                 d3.select(element[0]).append('div').html('<h4>selected child types</h4>');
                 d3.select(element[0]).append('div').html(childType);

                 var cellIndexes = cells.indexes;
                 var targets = volumeHelpers.getAggregateChildTargetNames(cellIndexes, childType, useTargetLabelGroups);
                 d3.select(element[0]).append('div').html('<h4>all targets</h4>');
                 d3.select(element[0]).append('div').html(targets);

                 cellIndexes.forEach(function(cellIndex) {
                 var results = volumeHelpers.getAggregateChildAttrGroupedByTarget([cellIndex], childType, useTargetLabelGroups, volumeHelpers.PerChildAttributes.CONFIDENCE, null, cellIndexes);
                 d3.select(element[0]).append('div').html('<h4>results</h4>');
                 d3.select(element[0]).append('div')
                 .selectAll('body').data(results.valuesLists[0]).enter().append('p').text(function(d) { return d.cellIndex + ', ' + d.childIndex + ', ' + d.value; });
                 });
                 */
            }
        }
    }
})();
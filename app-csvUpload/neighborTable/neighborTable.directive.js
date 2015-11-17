(function () {
    'use strict';

    angular.module('app.csvUpload')
        .directive('neighborBarChart', neighborBarChart);

    neighborBarChart.$inject = ['$log', 'volumeCells', 'volumeStructures', 'volumeHelpers', 'visUtils', 'visTable'];

    function neighborBarChart($log, volumeCells, volumeStructures, volumeHelpers, visUtils, visTable) {

        return {
            link: link,
            restrict: 'E'
        };

        function link(scope, element, attribute) {
            var self = {};

            $log.debug('neighborBarChart - link');

            //self.svg = visUtils.createSvg(element[0]);
            //self.mainGroup = visUtils.createMainGroup(self.svg);
            scope.$on('cellsChanged', cellsChanged);

            self.numSmallMultiplesPerRow = 6;
            self.smallMultiplePadding = 10;
            self.smallMultipleWidth = (visUtils.getSvgWidth() - (self.numSmallMultiplesPerRow * self.smallMultiplePadding)) / self.numSmallMultiplesPerRow;
            self.smallMultipleHeight = 200;
            self.smallMultipleOffsets = new utils.Point2D(self.smallMultiplePadding + self.smallMultipleWidth, self.smallMultiplePadding + self.smallMultipleHeight);
            scope.broadcastChange();

            addDownloadButton();

            /**
             * @name addDownLoadButton
             * @desc adds a download button to the div id #sidebar.
             */
            function addDownloadButton() {
                d3.select('#sidebar')
                    .append('html')
                    .html('<hr>' +
                    '<button>Download</button>')
                    .on('click', downloadClicked);
            }

            function cellsChanged(slot, cells, childType, useTargetLabelGroups, useOnlySelectedTargets, selectedTargets, convertToNm, useRadius) {
                var useBarsInTable = scope.model.ui.useBarsInTable;
                $log.debug('neighborBarChart - cells changed');
                $log.debug(' cellIndexes', cells);
                $log.debug(' childType', childType);
                $log.debug(' useTargetLabelGroups', useTargetLabelGroups);
                $log.debug(' useOnlySelectedTargets', useOnlySelectedTargets);
                $log.debug(' selectedTargets', selectedTargets);
                $log.debug(' convertToNm', convertToNm);
                $log.debug(' useRadius', convertToNm);
                $log.debug(' convertToNm', useRadius);
                $log.debug(' useBarsInTable', useBarsInTable);

                // Copy to member variables
                self.cells = cells;
                self.childType = childType;
                self.useTargetLabelGroups = useTargetLabelGroups;
                self.useOnlySelectedTargets = useOnlySelectedTargets;
                self.selectedTargets = selectedTargets;
                var cellIndexes = cells.indexes;

                //visUtils.clearGroup(self.mainGroup);

                // Get list of targets
                var targets = getCellChildTargets(cellIndexes, childType, useTargetLabelGroups, useOnlySelectedTargets, selectedTargets);
                self.targets = targets;

                // Create header data from list of targets
                var headerData = ['id', 'label'];
                headerData = headerData.concat(targets);

                scope.overviewGridOptions = {};
                var columnDefs = [];
                var columnWidth = 100;
                headerData.forEach(function (field, i) {
                        $log.debug(field);
                        columnDefs.push({
                            field: field,
                            width: columnWidth,
                            displayName: field
                        });

                        if (i > 1) {
                            columnDefs[columnDefs.length - 1].cellTemplate = 'neighborTable/neighborTableCell.html';
                            columnDefs[columnDefs.length - 1].sortingAlgorithm = sortColumn;
                        }
                    }
                );
                scope.overviewGridOptions.columnDefs = columnDefs;
                // Create table data
                var tableData = [];
                var maxCount = -1;
                var minCount = 10000;

                scope.overviewGridOptions.data = [];

                cellIndexes.forEach(function (cellIndex) {
                    var results = volumeHelpers.getAggregateChildAttrGroupedByTarget([cellIndex], childType, useTargetLabelGroups, volumeHelpers.PerChildAttributes.CONFIDENCE, null, cellIndexes);
                    results.valuesLists.forEach(function (values, i) {
                        var targetsIndex = targets.indexOf(results.labels[i]);
                        if (targetsIndex != -1) {
                            maxCount = Math.max(maxCount, values.length);
                            minCount = Math.min(minCount, values.length);
                        }
                    });
                });


                cellIndexes.forEach(function (cellIndex) {
                    var results = volumeHelpers.getAggregateChildAttrGroupedByTarget([cellIndex], childType, useTargetLabelGroups, volumeHelpers.PerChildAttributes.CONFIDENCE, null, cellIndexes);
                    var rowData = {};
                    rowData.id = volumeCells.getCellAt(cellIndex).id;
                    rowData.label = volumeCells.getCellAt(cellIndex).label;

                    results.valuesLists.forEach(function (values, i) {
                        var currTarget = results.labels[i];
                        rowData[currTarget] = {
                            values: values,
                            fraction: (values.length / maxCount),
                            width: columnWidth
                        };
                        var targetsIndex = targets.indexOf(results.labels[i]);
                        if (targetsIndex != -1) {
                            // Align rowData with targets
                            // Offset by 2 b/c rowData[0] and rowData[1] are already taken by cell id and label
                            //rowData[targetsIndex + 2] = values;
                            maxCount = Math.max(maxCount, values.length);
                            minCount = Math.min(minCount, values.length);
                        }
                    });
                    scope.overviewGridOptions.data.push(rowData);
                });


                //var table = new visTable.TableD3();

                //table.activate(headerData, tableData, self.mainGroup, useBarsInTable, minCount, maxCount, onCellClicked);

                scope.gridOptions = {};
                scope.gridOptions.enableFullRowSelection = true;
                scope.gridOptions.multiSelect = false;
                scope.gridOptions.columnDefs = [{
                    field: 'id',
                    displayName: 'id',
                    width: 75
                }, {
                    field: 'count',
                    displayName: 'count',
                    width: 75
                }, {
                    field: 'children',
                    displayName: 'children'
                }];

                scope.gridOptions.onRegisterApi = function (gridApi) {
                    scope.gridApi = gridApi;
                    gridApi.selection.on.rowSelectionChanged(scope, function (row) {
                        var msg = 'row selected ';
                        console.log(row);
                    });
                };

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

            function downloadClicked() {

                var data = [];
                var header = [];

                self.cells.indexes.forEach(function (cellIndex) {

                    var results = volumeHelpers.getPerChildAttrGroupedByTypeAndTarget([cellIndex], self.childType, self.useTargetLabelGroups, volumeHelpers.PerChildAttributes.CONFIDENCE, null, self.cells.indexes);

                    if (header.length == 0) {

                        header.push('id');
                        header.push('label');

                        results.labels.forEach(function (label, i) {
                            var targetIndex = self.targets.indexOf(label);
                            if (targetIndex != -1) {
                                header[targetIndex + 2] = (label + ' (' + volumeStructures.getChildStructureTypeCode(results.childTypes[i]) + ')');
                            }
                        });
                        $log.debug(header);
                    }

                    var rowData = [];

                    var cell = volumeCells.getCellAt(cellIndex);
                    rowData.push(cell.id);
                    rowData.push(cell.label);

                    results.valuesLists.forEach(function (values, i) {

                        var targetsIndex = self.targets.indexOf(results.labels[i]);
                        if (targetsIndex != -1) {
                            rowData[targetsIndex + 2] = (values.length);
                        }
                    });

                    data.push(rowData);
                });

                var csv = utils.dataToText(header);

                data.forEach(function (row) {
                    csv += utils.dataToText(row);
                });

                scope.saveData(csv);
            }

            function getCellChildTargets(cellIndexes, childType, useTargetLabelGroups, useOnlySelectedTargets, selectedTargets) {
                var targets;
                if (!useOnlySelectedTargets) {
                    targets = selectedTargets;
                } else {
                    targets = volumeHelpers.getAggregateChildTargetNames(cellIndexes, childType, useTargetLabelGroups);
                }

                targets.sort(function (a, b) {
                    return a.toLowerCase().localeCompare(b.toLowerCase());
                });

                return targets;
            }

            function onCellClicked(valueList) {
                console.log(valueList);

                var uniqueTargets = [];
                var childrenPerTarget = [];
                var numChildrenPerTarget = [];
                valueList.forEach(function (value) {
                    var id = volumeCells.getCellNeighborIdFromChildAndPartner(value.cellIndex, value.childIndex, value.partnerIndex);
                    var child = volumeCells.getCellChildAt(value.cellIndex, value.childIndex);
                    var currIndex = uniqueTargets.indexOf(id);
                    if (currIndex == -1) {
                        uniqueTargets.push(id);
                        currIndex = uniqueTargets.length - 1;
                        childrenPerTarget[currIndex] = '';
                        childrenPerTarget[currIndex] += child.id;
                        numChildrenPerTarget[currIndex] = 1;
                    } else {
                        childrenPerTarget[currIndex] += ', ' + child.id;
                        numChildrenPerTarget[currIndex] += 1;
                    }
                });

                scope.gridOptions.data = [];
                uniqueTargets.forEach(function (target, i) {
                    scope.gridOptions.data.push({
                        id: target,
                        count: numChildrenPerTarget[i],
                        children: childrenPerTarget[i]

                    });
                });

                scope.$apply();
            }

            function sortColumn(a, b, rowA, rowB, direction) {
                var aData = a.values.length;
                var bData = b.values.length;
                if (aData < bData) {
                    return -1;
                } else if (aData == bData) {
                    return 0;
                } else {
                    return 1;
                }
            }
        }
    }
})();
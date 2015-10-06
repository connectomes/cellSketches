(function () {
    'use strict';

    angular.module('app.helloWorld')
        .directive('childrenRadius', childrenRadius);

    childrenRadius.$inject = ['volumeCells', 'volumeStructures'];

    function childrenRadius(volumeCells, volumeStructures) {
        var useRadius = true;
        return {
            link: link,
            restrict: 'EA'
        };

        function link(scope, element, attrs) {
            var svgWidth = 1350;
            var svgHeight = 800;

            var svg = d3.select(element[0]).
                append('svg').attr({
                    width: svgWidth,
                    height: svgHeight
                });

            var mainPadding = 20;
            var mainWidth = svgWidth - mainPadding;
            var mainHeight = svgHeight - mainPadding;
            var mainGroup = svg.append('g').
                attr({
                    'transform': 'translate(' + mainPadding / 2 + ',' + mainPadding / 2 + ')'
                });

            var numSmallMultiplesPerRow = 6;
            var smallMultiplePadding = 10;
            var smallMultipleWidth = (svgWidth - (numSmallMultiplesPerRow * smallMultiplePadding)) / numSmallMultiplesPerRow;
            var smallMultipleHeight = 250;
            var smallMultipleOffsets = new utils.Point2D(smallMultiplePadding + smallMultipleWidth, smallMultiplePadding + smallMultipleHeight);

            scope.$on('cellsChanged', cellsChanged);

            function cellsChanged(slot, cells, childType, useSecondaryCells, secondaryCells) {
                mainGroup.selectAll('*').remove();
                addOutlineToGroup(mainGroup, mainWidth, mainHeight);

                //var childType = undefined;
                // Get a unique list of all cell partner class types.
                // This will be labels for the yAxis.
                var targets = getTargetLabels(cells, childType, useSecondaryCells, secondaryCells);

                targets.sort();

                var vals = getTargetDataList(cells, childType, targets, useSecondaryCells, secondaryCells);
                var targetDataList = vals.list;
                var minChildDistance = vals.minChildDistance;
                var maxChildDistance = vals.maxChildDistance;

                var yMin = 0;
                var yMax = 0;

                for (var i = 0; i < targetDataList.length; ++i) {

                    var distances = targetDataList[i].children.map(function (d) {
                        return d.distance;
                    });

                    var x = d3.scale.linear()
                        .domain([0, maxChildDistance]);

                    var data = d3.layout.histogram()
                        .range([0, maxChildDistance])
                        .bins(x.ticks(10))
                    (distances);

                    yMax = Math.max(d3.max(data, function (d) {
                        return d.y;
                    }), yMax);
                }

                for (i = 0; i < targetDataList.length; ++i) {

                    var chartGroup = mainGroup.append('g').attr({
                        transform: function () {
                            var position = computeGridPosition(i, numSmallMultiplesPerRow);
                            position = position.multiply(smallMultipleOffsets).add(new utils.Point2D(smallMultiplePadding, 10));
                            return 'translate' + position.toString();
                        }
                    });


                    var chart = new Histogram(chartGroup, [targetDataList[i]], targetDataList[i].targetLabel, smallMultipleHeight, smallMultipleWidth, [0, maxChildDistance], [yMin, yMax], markClickCallback);
                }

                function getCellPartnersOfLabel(cellPartners, label) {
                    for (var i = 0; i < cellPartners.length; ++i) {
                        if (cellPartners[i].label == label) {
                            return cellPartners[i].neighborIndexes;
                        }
                    }
                    return [];
                }
            }

            /**
             * @name getTargetLabels
             * @returns Array of unique target names. These will be the histogram titles.
             */
            function getTargetLabels(cells, childType, useSecondaryCells, secondaryCells) {

                var targets = [];

                if (!useSecondaryCells) {
                    // For each loaded set...
                    for (var i = 0; i < cells.length; ++i) {

                        // For each cell in the set...
                        for (var j = 0; j < cells[i].indexes.length; ++j) {

                            var currIndex = cells[i].indexes[j];
                            var currPartners = volumeCells.getCellNeighborLabelsByChildType(currIndex, childType);

                            // For each cell partner label...
                            for (var partnerIndex = 0; partnerIndex < currPartners.length; ++partnerIndex) {

                                // Add it to a list of unique labels.
                                var currLabel = currPartners[partnerIndex].label;

                                if (targets.indexOf(currLabel) == -1) {
                                    targets.push(currLabel);
                                }
                            }
                        }
                    }
                } else {
                    for (i = 0; i < secondaryCells.length; ++i) {
                        targets.push(secondaryCells[i].name);
                    }
                }
                return targets;
            }

            /**
             * @name getTargetDataList
             * @params targetList, childType, useSecondaryCells, secdonaryCells
             * @returns Object containing 1) Array of all children in cells that grouped by their connection to
             * targetCells along with a value (distance) 2) minDistance of children and 3) maxDistance of children.
             */
            function getTargetDataList(cells, childType, targets, useSecondaryCells, secondaryCells) {

                var minChildDistance = 10000000;
                var maxChildDistance = 0.0;
                var targetDataList = [];
                var targetData;
                if (!useSecondaryCells) {
                    for (var target = 0; target < targets.length; ++target) {
                        var targetData = {};
                        var currTarget = targets[target];
                        targetData.targetLabel = currTarget;
                        targetData.children = [];

                        // For each of the loaded cell sets.
                        for (var i = 0; i < cells.length; ++i) {

                            // For each cell in the set.
                            for (var j = 0; j < cells[i].indexes.length; ++j) {

                                var currIndex = cells[i].indexes[j];
                                var currPartners = volumeCells.getCellNeighborLabelsByChildType(currIndex, childType);
                                var currCellCog = volumeCells.getCellCenterOfGravityAt(currIndex);

                                // For each partner of the cell.
                                for (var partnerIndex = 0; partnerIndex < currPartners.length; partnerIndex++) {
                                    // If the partner doesn't point to the current label then continue.
                                    if (currPartners[partnerIndex].label != currTarget) {
                                        continue;
                                    }

                                    // For each child that is connected to the desired target.
                                    var currChildIndexes = currPartners[partnerIndex].childIndexes;
                                    for (var childIndex = 0; childIndex < currChildIndexes.length; ++childIndex) {
                                        var currChildIndex = currChildIndexes[childIndex];
                                        var childCog = volumeCells.getCellChildCenterOfGravityAt(currIndex, currChildIndex);
                                        var distance = childCog.distance(currCellCog);

                                        if (useRadius) {
                                            distance = volumeCells.getCellChildRadiusAt(currIndex, currChildIndex) * 2;
                                        }

                                        minChildDistance = Math.min(minChildDistance, distance);

                                        maxChildDistance = Math.max(maxChildDistance, distance);

                                        // TODO: assert this label is equal to target label.
                                        // console.log(volumeCells.getCellAt(currPartners[partnerIndex].neighborIndexes[childIndex]).label);
                                        targetData.children.push({
                                            distance: distance,
                                            parentIndex: currIndex,
                                            childIndex: childIndex,
                                            targetIndex: currPartners[partnerIndex].neighborIndexes[childIndex]
                                        });
                                    }
                                }

                            }
                        }
                        targetDataList.push(targetData);
                    }
                } else {
                    for (target = 0; target < targets.length; ++target) {
                        targetData = {};
                        targetData.targetLabel = targets[target];
                        targetData.children = [];


                        // Find the set of cell ids that we're interested in
                        var currTargetIndexes = [];
                        for (var secondaryCellIndex = 0; secondaryCellIndex < secondaryCells.length; secondaryCellIndex++) {
                            if (secondaryCells[secondaryCellIndex].name == targets[target]) {
                                currTargetIndexes = secondaryCells[secondaryCellIndex].indexes;
                                break;
                            }
                        }

                        if (currTargetIndexes.length == 0) {
                            throw 'Error getting cell targets';
                        }

                        // For each of the loaded cell sets.
                        for (i = 0; i < cells.length; ++i) {
                            // For each cell in the set.
                            for (j = 0; j < cells[i].indexes.length; ++j) {
                                currIndex = cells[i].indexes[j];
                                currCellCog = volumeCells.getCellCenterOfGravityAt(currIndex);
                                currChildIndexes = volumeCells.getCellChildrenConnectedToIndexes(currIndex, currTargetIndexes, childType);
                                for (childIndex = 0; childIndex < currChildIndexes.length; ++childIndex) {
                                    currChildIndex = currChildIndexes[childIndex];
                                    childCog = volumeCells.getCellChildCenterOfGravityAt(currIndex, currChildIndex);
                                    distance = childCog.distance(currCellCog);
                                    if (useRadius) {
                                        distance = volumeCells.getCellChildRadiusAt(currIndex, currChildIndex) * 2;
                                    }
                                    //var distance = volumeCells.getCellChildRadiusAt(currIndex, currChildIndex) * 2;
                                    minChildDistance = Math.min(minChildDistance, distance);
                                    maxChildDistance = Math.max(maxChildDistance, distance);

                                    // TODO: assert this label is equal to target label.
                                    // console.log(volumeCells.getCellAt(currPartners[partnerIndex].neighborIndexes[childIndex]).label);
                                    targetData.children.push({
                                        distance: distance,
                                        parentIndex: currIndex,
                                        childIndex: childIndex,
                                        targetIndex: volumeCells.getCellChildPartnerAt(currIndex, childIndex).parentIndex
                                    });
                                }
                            }
                        }
                        targetDataList.push(targetData);
                    }
                }
                return {
                    minChildDistance: minChildDistance,
                    maxChildDistance: maxChildDistance,
                    list: targetDataList
                };
            }

            // TODO Put this somewhere else
            function computeGridPosition(i, numSmallMultiplesPerRow) {
                if (i < numSmallMultiplesPerRow) {
                    return new utils.Point2D(i, 0);
                } else {
                    var row = Math.floor(i / numSmallMultiplesPerRow);
                    var col = i % numSmallMultiplesPerRow;
                    return new utils.Point2D(col, row);
                }
            }

            function markClickCallback(d) {
                console.log(d);

                var details = d.details;
                var str = '';
                for (var i = 0; i < details.parents.length; ++i) {
                    var cellIndex = details.parents[i];
                    var cellId = volumeCells.getCellAt(cellIndex).id;
                    var childId = volumeCells.getCellChildAt(cellIndex, details.children[i]).id;
                    str = str + 'Cell id: ' + cellId + ' child id: ' + childId + '.';
                }

                scope.$apply(function () {
                    scope.details = str;
                });
            }
        }
    }
})
();
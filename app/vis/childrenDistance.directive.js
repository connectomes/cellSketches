(function () {
    'use strict';

    angular.module('app.csvUpload')
        .directive('childrenDistance', childrenDistance);

    childrenDistance.$inject = ['volumeCells', 'volumeStructures'];

    function childrenDistance(volumeCells, volumeStructures) {
        return {
            link: link,
            restrict: 'E'
        };

        function link(scope, element, attrs) {
            var svgWidth = 1350;
            var svgHeight = 800;

            var svg = d3.select(element[0]).append('svg').attr({
                width: svgWidth,
                height: svgHeight
            }).on('click', clearSelection);

            var mainPadding = 20;
            var mainWidth = svgWidth - mainPadding;
            var mainHeight = 500;
            var detailHeight = 250;
            var mainGroup = svg.append('g').attr({
                'transform': 'translate(' + mainPadding / 2 + ',' + mainPadding / 2 + ')'
            });

            var detailGroup = svg.append('g')
                .attr({
                    'transform': 'translate(' + mainPadding / 2 + ',' + (mainHeight + mainPadding) + ')'
                });

            var detailRect = svg.append('rect')
                .attr({
                    'transform': 'translate(' + mainPadding / 2 + ',' + (mainHeight + mainPadding) + ')',
                    width: mainWidth,
                    height: detailHeight,
                    fill: 'transparent'
                })
                .on('click', function () {
                    d3.event.stopPropagation()
                });

            detailGroup.on('click', function () {
                d3.stopPropagation();
            });


            var numSmallMultiplesPerRow = 8;
            var smallMultiplePadding = -5;
            var smallMultipleWidth = (svgWidth - (numSmallMultiplesPerRow * smallMultiplePadding)) / numSmallMultiplesPerRow;
            var smallMultipleHeight = 125;
            var smallMultipleOffsets = new utils.Point2D(smallMultiplePadding + smallMultipleWidth, smallMultiplePadding + smallMultipleHeight);

            var currentSelection = null;

            scope.$on('cellsChanged', cellsChanged);
            if (scope.model.cells) {
                cellsChanged('', scope.model.cells, scope.model.childType, false, false, true);
            }

            /**
             * @name getTargetLabels
             * @param slot is unused
             * @param cells is an object that has a member 'indexes' -- other attributes of cells are ignored for now
             * @param childType is list of child type codes e.g., [28] for gap junctions
             * @param useSecondaryCells is currently unused
             * @param secondaryCells is also unused
             * @param convertToNm is true only if units should be converted from pixels to nm
             */
            function cellsChanged(slot, cells, childType, useSecondaryCells, secondaryCells, convertToNm, useRadius) {
                console.log('cells changed!!!');
                mainGroup.selectAll('*').remove();
                detailGroup.selectAll('*').remove();
                addOutlineToGroup(detailGroup, mainWidth, detailHeight);
                addOutlineToGroup(mainGroup, mainWidth, mainHeight);

                //var childType = undefined;
                // Get a unique list of all cell partner class types.
                // This will be labels for the yAxis.
                var targets = getTargetLabels(cells, childType, useSecondaryCells, secondaryCells);

                targets.sort();

                var vals = getTargetDataList(cells, childType, targets, useSecondaryCells, secondaryCells, convertToNm, useRadius);
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
                            position = position.multiply(smallMultipleOffsets);
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
                    // For each cell in the set...
                    for (var i = 0; i < cells.indexes.length; ++i) {

                        var currIndex = cells.indexes[i];
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
            function getTargetDataList(cells, childType, targets, useSecondaryCells, secondaryCells, convertToNm, useRadius) {

                var minChildDistance = 10000000;
                var maxChildDistance = 0.0;
                var targetDataList = [];
                var targetData;
                var currTarget;
                if (!useSecondaryCells) {
                    for (var target = 0; target < targets.length; ++target) {
                        targetData = {};
                        currTarget = targets[target];
                        targetData.targetLabel = currTarget;
                        targetData.children = [];

                        // For each cell in the set.
                        for (var i = 0; i < cells.indexes.length; ++i) {

                            var currIndex = cells.indexes[i];
                            var currPartners = volumeCells.getCellNeighborLabelsByChildType(currIndex, childType);
                            var center = volumeCells.getCellConvexHullAt(currIndex).centroid();
                            center = new utils.Point2D(center[0], center[1]);

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
                                    var distance = childCog.distance(center) * (convertToNm ? utils.nmPerPixel : 1.0);

                                    if (useRadius) {
                                        distance = volumeCells.getCellChildRadiusAt(currIndex, currChildIndex) * 2;
                                        distance = distance * (convertToNm ? utils.nmPerPixel : 1.0);
                                    }

                                    minChildDistance = Math.min(minChildDistance, distance);
                                    maxChildDistance = Math.max(maxChildDistance, distance);

                                    // TODO: assert this label is equal to target label.
                                    targetData.children.push({
                                        distance: distance,
                                        parentIndex: currIndex,
                                        childIndex: childIndex,
                                        targetIndex: currPartners[partnerIndex].neighborIndexes[childIndex]
                                    });
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


                        // For each cell in the set.
                        for (j = 0; j < cells.indexes.length; ++j) {
                            currIndex = cells.indexes[j];
                            //currCellCog = volumeCells.(currIndex);
                            center = volumeCells.getCellConvexHullAt(currIndex).centroid();
                            center = new utils.Point2D(center[0], center[1]);
                            currChildIndexes = volumeCells.getCellChildrenConnectedToIndexes(currIndex, currTargetIndexes, childType);
                            for (childIndex = 0; childIndex < currChildIndexes.length; ++childIndex) {
                                currChildIndex = currChildIndexes[childIndex];
                                childCog = volumeCells.getCellChildCenterOfGravityAt(currIndex, currChildIndex);
                                distance = childCog.distance(center) * (convertToNm ? utils.nmPerPixel : 1.0);
                                if (useRadius) {
                                    distance = volumeCells.getCellChildRadiusAt(currIndex, currChildIndex) * 2;
                                    distance = distance * (convertToNm ? utils.nmPerPixel : 1.0);
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
                                    targetIndex: volumeCells.getCellChildPartnerAt(currIndex, childIndex).parentId
                                });
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

                clearSelection();
                currentSelection = this;
                d3.select(this)
                    .style('fill', 'darkgrey');


                var details = d.details;
                updateDetails(d.details);
                d3.event.stopPropagation();
                scope.$apply(function () {
                    //scope.details = str;
                });
            }

            function updateDetails(details) {

                var parents = [];
                var children = [];

                // Group children ids by their parent ids
                for (var i = 0; i < details.parents.length; ++i) {
                    var cellIndex = details.parents[i];
                    var cellId = volumeCells.getCellAt(cellIndex).id;
                    var localIndex = parents.indexOf(cellId);
                    var childId = volumeCells.getCellChildAt(cellIndex, details.children[i]).id;
                    if (localIndex == -1) {
                        parents.push(cellId);
                        children.push([childId]);
                    } else {
                        children[localIndex].push(childId);
                    }
                }

                // Clear old details
                detailGroup.selectAll('g').remove();

                var group = detailGroup.append('g').attr({
                    transform: 'translate(' + 10 + ', ' + 16 + ')'
                });

                var cellsGroups = group.append('g');

                var cellsTexts = cellsGroups
                    .selectAll('g')
                    .data(parents)
                    .enter()
                    .append('g')
                    .attr('transform', function (d, i) {
                        return 'translate(' + 0 + ',' + (i * 50) + ')';
                    });

                cellsTexts.append('g')
                    .append('text')
                    .text(function (d) {
                        return 'Cell: ' + d;
                    });

                var childrenGroups = group.append('g');

                var childrenTexts = childrenGroups
                    .selectAll('g')
                    .data(children)
                    .enter()
                    .append('g')
                    .attr('transform', function (d, i) {
                        return 'translate(' + 20 + ', ' + (2 * (i + 1) - 1) * 25 + ')';
                    });

                childrenTexts.append('g').append('text').text(function (d) {
                    return 'Children: ' + d;
                });

            }

            function clearSelection() {
                if (currentSelection) {
                    d3.select(currentSelection)
                        .style('fill', '');
                }
                currentSelection = null;
                detailGroup.selectAll('*').remove();
                addOutlineToGroup(detailGroup, mainWidth, detailHeight);
            }
        }
    }
})
();
function addBlackRectToGroup(group) {
    group.append('rect')
        .attr({
            width: 10,
            height: 10,
            fill: 'black'
        });
}

function addBlackRectToGroup(group, width, height) {
    group.append('rect')
        .attr({
            width: width,
            height: height,
            fill: 'black'
        });
}

function addOutlineToGroup(group, width, height) {
    group.append('rect')
        .attr({
            width: width,
            height: height,
            fill: 'none'
        }).style({
            outline: 'thin solid black'
        });
}
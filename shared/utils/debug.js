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
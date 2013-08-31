function redrawPlayerData(loadedData) {
    "use strict";

    //console.log('redrawPlayerData()');

    var svg = d3.select(document.getElementById('canvas'));
    var circles = svg.selectAll('circle')
        .data(loadedData);

    // Initialize
    circles.enter().append('circle')
        .attr('r', 0)
        .attr('cx', 0)
        .attr('cy', 0)
        .attr('fill', 'blue')
        .attr('opacity', 0);

    // Update
    circles
        .transition() //.duration(1000).ease('cubic-in-out')
        .attr('r', function(player, i) {
            return _.keys(player.seasons).length * 5;
        })
        .attr('cy', function(player, i) {
            return Math.sqrt(player.getTotalPointsForRushing()) * 10;
        })
        .attr('cx', function(player, i) {
            return Math.sqrt(player.getTotalPointsForReceiving()) * 10;
        })        
        .attr("fill", function(player, i){return "hsl(" + Math.floor(Math.sqrt(player.getTotalPointsForReceiving()) * 360) + ",100%,50%)"})
        //.attr('cy', function(player, i){return player.getTotalPointsForReceiving();})
        .attr('opacity', 0.05);

    // Delete
    circles.exit()
        .remove();    
}

function run(availableData, loadedData) {
    "use strict";

    //console.log('run()');

    var numberOfDataToLoadPerIteration = Math.min(2, availableData.length);
    while (numberOfDataToLoadPerIteration--) {
        loadedData.push(availableData.pop());
    }
    redrawPlayerData(loadedData);

    if (availableData.length > 0) {
        setTimeout(run.call(null, availableData, loadedData), 100);
    }
}

function visualizeData() {
    "use strict";

    //console.log('visualizeData()');

    var availableData = _(storageManager.getPlayers()).filter(function(player, key) {
        return player.getTotalPointsFor() > 0;
    }).values().value() || []; //[0,1,2,3,4,5,6,7,8,9];
    var loadedData = [];

    setTimeout(run.call(null, availableData, loadedData), 100);
    /*
d3.select('body').selectAll('span')
    .data(availableData)
  .enter().append('span')
    .text(function(d) { return d.getTotalPointsFor()+' '; });

    var svgDocument = evt.target.ownerDocument;
var shape = svgDocument.createElementNS(svgns, 'circle');
shape.setAttributeNS(null, 'cx', 25);
shape.setAttributeNS(null, 'cy', 25);
shape.setAttributeNS(null, 'r',  20);
shape.setAttributeNS(null, 'fill', 'green');
*/
}
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
        .attr('opacity', 1);

    // Update
    circles
        .transition()
        .attr('r', function(player, i) {
            return 5;
        })
        .attr('cx', function(player, i) {debugger;
            return Math.sqrt(getTotalPlayerPointsFor(player) / player.seasons.length)*10;
        })
        .attr('cy', function(player, i) {
            return i*5;
        }); //.duration(1000).ease('cubic-in-out')
    // .attr("fill", function(player, i){return "hsl(" + Math.floor(Math.sqrt(player.getTotalPointsForReceiving()) * 360) + ",100%,50%)"})
    // //.attr('cy', function(player, i){return player.getTotalPointsForReceiving();})
    // .attr('opacity', 0.05);

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

function visualizeData(availableData) {
    "use strict";
    debugger;
    console.log(availableData.length)
    availableData = _.filter(availableData, function(element, index, list) {
        return element !== null;
    });
    console.log(availableData.length)

    console.log('visualizeData()');

    var loadedData = [];

    // d3.select('body').selectAll('span[class="label label-default"]')
    //     .data(availableData)
    //     .enter().append('span').attr('class', 'label label-default');

    // d3.select('body').selectAll('span[class="label label-default"]')
    //     .data(availableData).text(function(d) {
    //         return d.lastName + ', ' + d.firstName;
    //     })

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


// game

function getTotalGamePointsFor(game, propertyGroup) {
    var total = 0;

    if (game.points[propertyGroup]) {
        for (var k in game.points[propertyGroup]) {
            total += game.points[propertyGroup][k];
        }
    } else {
        for (var m in game.points) {
            for (var k in game.points[m]) {
                total += game.points[m][k];
            }
        }
    }

    return total;
}

// season

function getTotalSeasonPointsFor(season, propertyGroup) {
    var total = 0;
    for (var j in season.games) {
        total += getTotalGamePointsFor(season.games[j], propertyGroup);
    }

    return total;
}

// player
function getTotalPlayerPointsFor(player, propertyGroup) {
    var total = 0;
    for (var i in player.seasons) {
        total += getTotalSeasonPointsFor(player.seasons[i], propertyGroup);
    }

    return total;
};
// self.getTotalPointsForReceiving = function() {
//     return self.getTotalPointsFor('receiving');
// };
// self.getTotalPointsForRushing = function() {
//     return self.getTotalPointsFor('rushing');
// };
// self.getTotalPointsForPassing = function() {
//     return self.getTotalPointsFor('passing');
// };
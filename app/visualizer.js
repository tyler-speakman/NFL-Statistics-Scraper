function redrawPlayerData(loadedData) {
    "use strict";
    console.log('redrawPlayerData()');

    var maxTotalPoints = _.reduce(loadedData, function(memo, value, index, list) {
        return Math.max(memo, PlayerFunctions.getTotalPoints(value, index));
    }, 0);
    var maxNumberOfSeasons = _.reduce(loadedData, function(memo, value, index, list) {
        return Math.max(memo, PlayerFunctions.getNumberOfSeasons(value, index));
    }, 0);
    var maxAveragePoints = _.reduce(loadedData, function(memo, value, index, list) {
        return Math.max(memo, PlayerFunctions.getAveragePoints(value, index));
    }, 0);

    var STAGE_WIDTH = $('svg').width();
    var STAGE_HEIGHT = $('svg').height();

    // 
    var svg = d3.select(document.getElementById('canvas'));
    var circles = svg.selectAll('circle')
        .data(loadedData);

    // Initialize
    circles.enter().append('circle')
        .attr('r', 0)
        .attr('cx', 0)
        .attr('cy', 0)
        .attr('fill', 'black')
        .attr('stroke', 'black')
        .attr('stroke-width', '0')
        .attr('stroke-dasharray', '2,2')
        .attr('opacity', 0.1)
        .append("svg:title")
        .text(function(player) {
            return player.firstName + ' ' + player.lastName + '(' + PlayerFunctions.getLastSeasonPlayed(player) + ') of ' + player.team + ' played ' + PlayerFunctions.getNumberOfSeasons(player) + ' seasons to achieve ' + PlayerFunctions.getTotalPoints(player) + ' points by averaging ' + PlayerFunctions.getAveragePoints(player) + '. Has a ' + PlayerFunctions.getPlayerMomentum(player) + '% momentum.';
        });


    // Update
    circles
        .transition()
        .attr('r', function(player, i) {
            return maxNumberOfSeasons === 0 ? 0 : Math.pow(PlayerFunctions.getAveragePoints(player, i) / maxAveragePoints, 3) * 10 + 4;
        })
        .attr('cx', function(player, i) {
            return maxNumberOfSeasons === 0 ? 0 : PlayerFunctions.getNumberOfSeasons(player, i) / maxNumberOfSeasons * STAGE_WIDTH;
        })
        .attr('cy', function(player, i) {
            return maxNumberOfSeasons === 0 ? 0 : PlayerFunctions.getTotalPoints(player, i) / maxTotalPoints * STAGE_HEIGHT;
        })
        .attr('stroke-width', function(player, i) {
            return PlayerFunctions.getLastSeasonPlayed(player, i) == 2012 ? 5 : 0;
        });
    //.duration(1000).ease('cubic-in-out')
    // .attr("fill", function(player, i){return "hsl(" + Math.floor(Math.sqrt(player.getTotalPointsForReceiving()) * 360) + ",100%,50%)"})
    // //.attr('cy', function(player, i){return player.getTotalPointsForReceiving();})
    // .attr('opacity', 0.05);

    // Delete
    circles.exit()
        .remove();
}

function run(availableData, loadedData) {
    "use strict";
    console.log('run()');

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
    console.log('visualizeData()');

    availableData = _.filter(availableData, function(element, index, list) {
        return element !== null;
    });


    var loadedData = [];

    setTimeout(run.call(null, availableData, loadedData), 100);
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


var PlayerFunctions = (function() {
    var self = {};

    self.getTotalPoints = function(player) {
        return getTotalPlayerPointsFor(player);
    }

    self.getNumberOfSeasons = function(player) {
        return player.seasons.length;
    }

    self.getAveragePoints = function(player) {
        return player.seasons.length === 0 ? 0 : Math.floor(self.getTotalPoints(player) / self.getNumberOfSeasons(player));
    }

    self.getLastSeasonPlayed = function(player) {
        return _.reduce(player.seasons, function(memo, value, index, list) {
            var season = value;
            return season.index;
        }, 0)
    }

    self.getPlayerMomentum = function(player) {
        // If the player wasn't active last year, then return 0
        if (self.getLastSeasonPlayed(player != 2012)) {
            return 0;
        }

        var seasonalMomentum = _.reduce(player.seasons, function(memo, value, index, list) {
            if (index == 0) {
                return memo;
            }

            var lastSeason = list[index - 1];
            var thisSeason = list[index];
            console.log("????????????" + (2012 - thisSeason.index))
            var weight = thisSeason.index == 2012 ? 1 : (1 / (2012 - thisSeason.index))
            if (getTotalSeasonPointsFor(thisSeason) > getTotalSeasonPointsFor(lastSeason)) {
                return memo + 1 * weight;
            } else if (getTotalSeasonPointsFor(thisSeason) < getTotalSeasonPointsFor(lastSeason)) {
                return memo - 1 * weight;
            } else {
                return memo;
            }
        }, 0);

        return Math.round(seasonalMomentum / self.getNumberOfSeasons(player) * 100);
    }

    return self;
})();

// self.getTotalPointsForReceiving = function() {
//     return self.getTotalPointsFor('receiving');
// };
// self.getTotalPointsForRushing = function() {
//     return self.getTotalPointsFor('rushing');
// };
// self.getTotalPointsForPassing = function() {
//     return self.getTotalPointsFor('passing');
// };
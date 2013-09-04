function redrawPlayerData(loadedData) {
    "use strict";
    // console.log('redrawPlayerData()');

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
    var VARIABLE_RADIUS = 10;
    var BASE_RADIUS = 4;

    var svg = d3.select(document.getElementById('canvas'));

    // Initialize
    var filterDataForMarkers = _.where(loadedData, function(value, index, list) {
        var player = value;
        return PlayerFunctions.getAveragePoints(player) / maxAveragePoints >= 0.25;
    });
    var markers = svg.selectAll('circle')
        .data(filterDataForMarkers);
    markers.enter().append('circle')
        .attr('r', 0)
        .attr('cx', 0)
        .attr('cy', 0)
        .attr('fill', 'grey')
        .attr('stroke', 'black')
        .attr('stroke-width', '0')
        .attr('stroke-dasharray', '2,2')
        .attr('opacity', 0.1)
        .append("svg:title")
        .text(PlayerFunctions.getTextSummary);

    // Update
    markers
        .transition()
        .attr('r', function(player, index) {
            return maxNumberOfSeasons === 0 ? 0 : PlayerFunctions.getTotalPoints(player) / maxTotalPoints * VARIABLE_RADIUS + BASE_RADIUS;
        })
        .attr('cx', function(player, index) {
            debugger;
            var jig = PlayerFunctions.getPercentHash(player);
            jig = (jig < 0.5 ? jig * 2 * -1 : jig) * VARIABLE_RADIUS
            return maxNumberOfSeasons === 0 ? 0 : PlayerFunctions.getNumberOfSeasons(player) / maxNumberOfSeasons * (STAGE_WIDTH - VARIABLE_RADIUS - BASE_RADIUS) + jig;
        })
        .attr('cy', function(player, index) {
            return maxNumberOfSeasons === 0 ? 0 : PlayerFunctions.getAveragePoints(player) / maxAveragePoints * (STAGE_HEIGHT - VARIABLE_RADIUS - BASE_RADIUS);
        })
        .attr('stroke-width', function(player, index) {
            return PlayerFunctions.getLastSeasonPlayed(player) == 2012 ? 5 : 0;
        });
    //.duration(1000).ease('cubic-in-out')

    // Delete
    markers.exit()
        .remove();

    // Initialize
    var filterDataForLabels = _.where(filterDataForMarkers, function(value, index, list) {
        var player = value;
        return PlayerFunctions.getPlayerMomentum(player, index) > 0.05; // && PlayerFunctions.getNumberOfSeasons(player)>2;
    });
    var labels = svg.selectAll('text')
        .data(filterDataForLabels);
    labels
        .enter()
        .append("text")
        .text(function(player) {
            return player.lastName;
        })
        .attr('opacity', 0.5)
        .attr("font-family", "sans-serif")
        .attr("font-size", "12px")
        .attr("fill", "black")
        .append("svg:title")
        .text(PlayerFunctions.getTextSummary);

    // Update
    labels
        .attr('x', function(player, index) {
            var jig = PlayerFunctions.getPercentHash(player);
            jig = (jig < 0.5 ? jig * 2 * -1 : jig) * VARIABLE_RADIUS
            return maxNumberOfSeasons === 0 ? 0 : PlayerFunctions.getNumberOfSeasons(player) / maxNumberOfSeasons * (STAGE_WIDTH - VARIABLE_RADIUS - BASE_RADIUS) + jig - $(this).width() / 2;
        })
        .attr('y', function(player, index) {
            return maxNumberOfSeasons === 0 ? 0 : PlayerFunctions.getAveragePoints(player) / maxAveragePoints * (STAGE_HEIGHT - VARIABLE_RADIUS - BASE_RADIUS) - $(this).height() / 2;
        });

}

function run(availableData, loadedData) {
    "use strict";
    // console.log('run()');

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

    self.getHash = function(player) {
        var str = player.firstName + player.lastName + player.team;
        var hash = 0;
        if (str.length == 0) return hash;
        for (i = 0; i < str.length; i++) {
            char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }

        return hash;
    };

    self.getPercentHash = function(player) {
        var MAX_INT = Math.pow(2, 32) - 1;
        return self.getHash(player) / MAX_INT;
    }

    self.getTotalPoints = function(player) {
        return getTotalPlayerPointsFor(player);
    };

    self.getNumberOfSeasons = function(player) {
        return player.seasons.length;
    };

    self.getAveragePoints = function(player) {
        return player.seasons.length === 0 ? 0 : Math.floor(self.getTotalPoints(player) / self.getNumberOfSeasons(player));
    };

    self.getLastSeasonPlayed = function(player) {
        return _.reduce(player.seasons, function(memo, value, index, list) {
            var season = value;
            return season.index;
        }, 0);
    };

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

        return (seasonalMomentum / self.getNumberOfSeasons(player));
    }

    self.getTextSummary = function(player) {
        return player.firstName + ' ' + player.lastName + ' of ' + player.team +
            '\n# of seasons: ' + self.getNumberOfSeasons(player) +
            '\nTotal points: ' + self.getTotalPoints(player) + ' (~' + self.getAveragePoints(player) + ' per season)' +
            '\nMomentum ' + (self.getPlayerMomentum(player) * 100).toFixed(2) + '% momentum.';
    };

    return self;
    // return {
    //     getHash: _.memoize(self.getHash),
    //     getPercentHash: _.memoize(self.getPercentHash),
    //     getTotalPoints: _.memoize(self.getTotalPoints),
    //     getNumberOfSeasons: _.memoize(self.getNumberOfSeasons),
    //     getAveragePoints: _.memoize(self.getAveragePoints),
    //     getLastSeasonPlayed: _.memoize(self.getLastSeasonPlayed),
    //     getPlayerMomentum: _.memoize(self.getPlayerMomentum),
    //     getTextSummary: _.memoize(self.getTextSummary)
    // };
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
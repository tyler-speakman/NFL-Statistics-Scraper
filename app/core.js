define(["encode"], function(encode) {
    "use strict";
    /**
     * A class representing an NFL player
     * @param {[type]} id
     * @param {[type]} firstName
     * @param {[type]} lastName
     * @param {[type]} position
     * @param {[type]} status
     */

    function Player(id, firstName, lastName, team, position, status) {
        this.id = id;
        this.firstName = firstName;
        this.lastName = lastName;
        this.position = position;
        this.status = status;
        this.team = team;
        this.seasons = [];

        return this;
    }
    Player.prototype.getHash = function(player) {
        // console.log("PlayerFunctions.getHash(" + player + ")");
        if (player === null || player === undefined) {
            player = this;
        }

        return encode.hash(String(Math.pow(player.id, 2)));
    };
    Player.prototype.getTotalPointsFor = function(player, propertyGroup) {
        var total = 0;
        for (var i in player.seasons) {
            total += Season.prototype.getTotalPointsFor(player.seasons[i], propertyGroup);
        }

        return total;
    };
    Player.prototype.getPercentHash = function(player) {
        // console.log("PlayerFunctions.getPercentHash(" + player + ")");
        if (player === null || player === undefined) {
            player = this;
        }

        var MAX_INT = Math.pow(2, 32) - 1;
        return Player.prototype.getHash(player) / MAX_INT;
    };
    Player.prototype.getTotalPoints = function(player) {
        // console.log("PlayerFunctions.getTotalPoints(" + player + ")");
        if (player === null || player === undefined) {
            player = this;
        }

        return Player.prototype.getTotalPointsFor(player);
    };
    Player.prototype.getNumberOfSeasons = function(player) {
        // console.log("PlayerFunctions.getNumberOfSeasons(" + player + ")");
        if (player === null || player === undefined) {
            player = this;
        }

        return player.seasons.length;
    };
    Player.prototype.getAverageNumberOfGamesPerSeason = function(player) {
        // console.log("PlayerFunctions.getAveragePoints(" + player + ")");
        if (player === null || player === undefined) {
            player = this;
        }

        return player.seasons.length === 0 ? 0 : Math.floor(_.reduce(player.seasons, function(memo, value, index, list) {
            var season = value;
            return memo + Season.prototype.getNumberOfGames(season);
        }, 0) / Player.prototype.getNumberOfSeasons(player));
    };
    Player.prototype.getAveragePointsPerSeason = function(player) {
        // console.log("PlayerFunctions.getAveragePoints(" + player + ")");
        if (player === null || player === undefined) {
            player = this;
        }

        return player.seasons.length === 0 ? 0 : Math.floor(Player.prototype.getTotalPoints(player) / Player.prototype.getNumberOfSeasons(player));
    };
    Player.prototype.getAveragePointsPerGame = function(player) {
        // console.log("PlayerFunctions.getAveragePoints(" + player + ")");
        if (player === null || player === undefined) {
            player = this;
        }

        return player.seasons.length === 0 ? 0 : Math.floor(_.reduce(player.seasons, function(memo, value, index, list) {
            var season = value;
            return memo + Season.prototype.getAveragePointsPerGameFor(season);
        }, 0) / Player.prototype.getNumberOfSeasons(player));
    };
    Player.prototype.getLastSeasonPlayed = function(player) {
        // console.log("PlayerFunctions.getLastSeasonPlayed(" + player + ")");
        if (player === null || player === undefined) {
            player = this;
        }

        return _.reduce(player.seasons, function(memo, value, index, list) {
            var season = value;
            return Math.max(season.index, memo);
        }, 0);
    };
    Player.prototype.getPlayerMomentum = function(player) {
        // console.log("PlayerFunctions.getTextSummary(" + player + ")");
        if (player === null || player === undefined) {
            player = this;
        }

        var currentYear = (new Date()).getUTCFullYear();
        var seasonalMomentum = _.reduce(player.seasons, function(memo, value, index, list) {
            if (index === 0) {
                return memo;
            }

            var thisSeason = list[index];
            var lastSeason = list[index - 1];
            var weight = thisSeason.index == currentYear ? 1 : (1 / (currentYear - thisSeason.index)); //(1 / Math.pow(currentYear - thisSeason.index, 2));
            if (Season.prototype.getAveragePointsPerGameFor(thisSeason) > Season.prototype.getAveragePointsPerGameFor(lastSeason)) {
                return memo + weight;
            } else if (Season.prototype.getAveragePointsPerGameFor(thisSeason) < Season.prototype.getAveragePointsPerGameFor(lastSeason)) {
                return memo - weight;
            } else {
                return memo;
            }
        }, 0);

        return seasonalMomentum;
    };
    Player.prototype.toString = function(player) {
        // console.log("PlayerFunctions.getTextSummary(" + player + ")");
        if (player === null || player === undefined) {
            player = this;
        }

        return player.firstName + " " + player.lastName + " of " + player.team;
    };
    Player.prototype.toStringSummary = function(player) {
        // console.log("PlayerFunctions.getTextSummary(" + player + ")");
        if (player === null || player === undefined) {
            player = this;
        }

        return Player.prototype.toString(player) +
            "\n# of seasons: " + Player.prototype.getNumberOfSeasons(player) + " (last played: " + Player.prototype.getLastSeasonPlayed(player) + ")" +
            "\nTotal points: " + Player.prototype.getTotalPoints(player) + " (~" + Player.prototype.getAveragePointsPerSeason(player) + " per season and ~" + Player.prototype.getAveragePointsPerGame(player) + " per game)" +
            "\nMomentum " + (Player.prototype.getPlayerMomentum(player) * 100).toFixed(2) + "% momentum";
    };    

    /**
     * A class representing a single player's season statistics (i.e., 2012 season, 2013 season, etc.)
     * @param {int} index   The season year (i.e., 2012 season, 2013 season, etc.)
     */

    function Season(index) {
        this.index = index; // year
        this.games = [];

        return this;
    }

    Season.prototype.getNumberOfGames = function(season) {
        if (season === null || season === undefined) {
            season = this;
        }

        return season.games.length;
    };
    Season.prototype.getTotalPointsFor = function(season, propertyGroup) {
        if (season === null || season === undefined) {
            season = this;
        }

        var totalPoints = 0;
        for (var j in season.games) {
            totalPoints += Game.prototype.getTotalPointsFor(season.games[j], propertyGroup);
        }

        return totalPoints;
    };
    Season.prototype.getAveragePointsPerGameFor = function(season, propertyGroup) {
        if (season === null || season === undefined) {
            season = this;
        }

        var totalPoints = Season.prototype.getTotalPointsFor(season, propertyGroup);
        var averagePointsPerGame = totalPoints / season.games.length;

        return averagePointsPerGame;
    };

    /**
     * A class representing a single player's game statistics (i.e., game 1 of the 2012 season, etc.)
     * @param {int}     index       The game # (i.e., game 1 of the 2012 season, etc.)
     * @param {string}  opponent The opposing team's name (i.e., "@DAL" is an away game in Dallas, etc.)
     */

    function Game(index, date, opponent, playedInGame, startedGame) {
        this.index = index;
        this.date = date;
        this.playedInGame = playedInGame;
        this.startedGame = startedGame;
        this.opponent = opponent;
        this.score = {
            forTeam: 0,
            againstTeam: 0
        };
        this.points = {
            passing: {
                comp: 0,
                att: 0,
                pct: 0,
                yds: 0,
                avg: 0,
                td: 0,
                int: 0,
                sck: 0,
                scky: 0,
                rate: 0
            },
            rushing: {
                yds: 0,
                td: 0
            },
            receiving: {
                yds: 0,
                td: 0
            },
            misc: {
                fumtd: 0,
                twopt: 0
            },
            fum: {
                lost: 0
            }
        };

        return this;
    }
    Game.prototype.getTotalPointsFor = function(game, propertyGroup) {
        if (game === null || game === undefined) {
            game = this;
        }

        var total = 0;

        if (game.points[propertyGroup]) {
            for (var k in game.points[propertyGroup]) {
                total += game.points[propertyGroup][k];
            }
        } else {
            for (var m in game.points) {
                for (var n in game.points[m]) {
                    total += game.points[m][n];
                }
            }
        }

        return total;
    };

    /**
     * Extends functions (i.e., max / min values for a set, memoization, etc.)
     * @param  {Function} func The function to be extended.
     * @return {Function}      The extended function.
     */

    // function extendFunction(func) {
    //     var extendedFunction = func;

    //     // Add memoization to improve performance
    //     extendedFunction = _.memoize(func, self.getHash);

    //     // extendedFunction.max = function(data) {
    //     //     return mathEx.max(func, data);
    //     // };

    //     // extendedFunction.min = function(data) {
    //     //     return mathEx.min(func, data);
    //     // };

    //     return extendedFunction;
    // }

    // for (var playerFunction in Player.prototype) {
    //     Player.prototype[playerFunction] = (function(func) {
    //         return function(player) {
    //             if (player === null || player === undefined) {
    //                 return func;
    //             } else {
    //                 return _.memoize(func, Player.prototype.getHash);
    //             };
    //         };
    //     })(Player.prototype[playerFunction]);
    // }

    // for (var seasonFunction in Season.prototype) {
    //     Season.prototype[seasonFunction] = function(season) {var func = Season.prototype[seasonFunction]; if (season === null || season === undefined) {return func; } else {return extendFunction(func); }; }
    // }

    // for (var gameFunction in Game.prototype) {
    //     Game.prototype[gameFunction] = function(game) {var func = Game.prototype[gameFunction]; if (game === null || game === undefined) {return func; } else {return extendFunction(func); }; }
    // }    

    return {
        Player: Player,
        Season: Season,
        Game: Game
    };
});



// var PlayerFunctions = (function() {
//     var self = {};



//     /**
//      * Extends functions (i.e., max / min values for a set, memoization, etc.)
//      * @param  {Function} func The function to be extended.
//      * @return {Function}      The extended function.
//      */

//     function extendFunction(func) {
//         var extendedFunction = func;

//         // Add memoization to improve performance
//         extendedFunction = _.memoize(func, self.getHash);

//         extendedFunction.max = function(data) {
//             return mathEx.max(func, data);
//         };

//         extendedFunction.min = function(data) {
//             return mathEx.min(func, data);
//         };

//         return extendedFunction;
//     }

//     // return self;
//     return {
//         getHash: extendFunction(self.getHash),
//         getPercentHash: extendFunction(self.getPercentHash),
//         getTotalPoints: extendFunction(self.getTotalPoints),
//         getNumberOfSeasons: extendFunction(self.getNumberOfSeasons),
//         getAveragePoints: extendFunction(self.getAveragePoints),
//         getLastSeasonPlayed: extendFunction(self.getLastSeasonPlayed),
//         getPlayerMomentum: extendFunction(self.getPlayerMomentum),
//         getTextSummary: extendFunction(self.getTextSummary)
//     };
// })();

// self.getTotalPointsForReceiving = function() {
//     return self.getTotalPointsFor("receiving");
// };
// self.getTotalPointsForRushing = function() {
//     return self.getTotalPointsFor("rushing");
// };
// self.getTotalPointsForPassing = function() {
//     return self.getTotalPointsFor("passing");
// };
//
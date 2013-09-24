define(["encode", "core"], function(encode, core) {
    "use strict";

    /**
     * A Class that is used to generate a series of URLs which can later be processed.
     * @param {string} The base URL
     */

    function DocumentManager(url) {

        var uri = new URI(url);
        var queue = async.queue(processWithYql, 10);

        var self = {};

        self.getParameter = function(parameterName) {
            var search = uri.search(true);
            //console.log(parameterName +" : "+ search[parameterName]);
            return search[parameterName];
        };

        self.hasParameter = function(parameterName) {
            var parameterValue = self.getParameter(parameterName);
            return parameterValue !== null && parameterValue !== undefined;
        };

        self.setParameter = function(parameterName, parameterValue) {
            uri
                .removeSearch(parameterName)
                .addSearch(parameterName, parameterValue);
        };

        self.incrementParameter = function(parameterName, magnitudeOfIncrement) {
            magnitudeOfIncrement = magnitudeOfIncrement || 1;
            var newParameterValue = self.hasParameter(parameterName) ? parseInt(self.getParameter(parameterName), 10) + magnitudeOfIncrement : 0;
            self.setParameter(parameterName, newParameterValue);
        };

        self.decrementParameter = function(parameterName) {
            var newParameterValue = self.hasParameter(parameterName) ? parseInt(self.getParameter(parameterName), 10) - 1 : 0;
            self.setParameter(parameterName, newParameterValue);
        };

        self.getSegment = function(segmentIndex) {
            return uri.segment(segmentIndex);
        };

        self.setSegment = function(segmentIndex, segmentValue) {
            uri.segment(segmentIndex, segmentValue);
        };

        self.process = function(callback) {
            var url = uri.toString();
            console.log("DocumentManager.process(" + encode.hash(url) + ", " + url + ") : Initialize");

            // If no url, then exit.
            if (!url) {
                callback("No URL.", null);
            }

            queue.push(url, function(err, result) {
                if (err) {
                    console.log("DocumentManager.process(" + encode.hash(url) + ", " + url + ") : Fail");
                    callback(err);
                    return;
                }

                console.log("DocumentManager.process(" + encode.hash(url) + ", " + url + ") : Complete");
                callback(null, result);
            });
        };

        self.processAndIterate = function(iterate, isComplete, callback) {
            var results = [];
            iterationHandler(completionHandler);

            function iterationHandler(iterationHandlerCallback) {
                self.process(iterationHandlerCallback);
                iterate();
            }

            function completionHandler(err, result) {
                if (err) {
                    console.log("playersDocumentManager.process().completionHandler()" + " " + "Error" + err);
                }

                if (isComplete(result)) {
                    callback(err, results);
                } else {
                    results.push(result);
                    iterationHandler(completionHandler);
                }
            }
        };

        return self;


        function processWithYql(url, callback, retries) {
            var MAX_RETRIES = 3;
            retries = (retries === null || retries === undefined || isNaN(retries)) ? MAX_RETRIES : retries - 1;
            if (retries < 0) {
                callback("DocumentManager.processWithYql(" + encode.hash(url) + ", " + url + ") : Failed (" + MAX_RETRIES + " retries)", null);
            }

            var urlForYql = "http://query.yahooapis.com/v1/public/yql"; // + "&format=xml&callback=?";

            return $.ajax({
                url: urlForYql,
                data: {
                    q: "select * from html where url=\"" + url + "\" and xpath='//div[@id=\"main-content\"]'", //encodeURIComponent(),and xpath='//div[@id="main-content"]'
                    diagnostics: true,
                    debug: true,
                },
                cache: true
            }).done(function(data) {
                var result = $(data).find("query results #main-content");
                if (result.length === 0) {
                    var errors = _.reduce($(data).find("query diagnostics url[error]"), function(memo, value, index, list) {
                        var element = $(value);
                        return memo + element.attr("error") + ": \"" + element.text() + "\"; ";
                    }, "");

                    // callback("DocumentManager.processWithYql(" + encode.hash(url) + ", " + url + ") : Failed(" + errors + ")", result);
                    console.log("DocumentManager.processWithYql(" + encode.hash(url) + ", " + url + ") : Failed(" + errors + ")");
                    console.log("Retrying.. (" + retries + ")")

                    // Retry
                    processWithYql(url, callback, retries);
                } else {
                    callback(null, result);
                }
            });
        }

        function processWithAo(url, callback) {
            var urlForAnyOrigin = "http://anyorigin.com/get?url=" + encodeURIComponent(url) + "&callback=?";
            // console.log(urlForAnyOrigin);

            return $.ajax({
                dataType: "json",
                url: urlForAnyOrigin //,
                //cache: false
            }).done(function(data) {
                callback(null, $(data.contents));
            });
        }
    }

    /**
     * (async) Gets all the players who are in a specific position (i.e., quarterback, running-back, etc.)
     * @param  {string}   position  The position (i.e., quarterback, running-back, etc.)
     * @param  {Function} callback  The function to call when the action completes
     * @return {object[]}           An array of player objects
     */

    function getPlayersByPosition(position, callback) {

        /**
         * Used to generate a series of URLs which can later be processed. More specifically, this instance iterates a list of players based on their position on the field (i.e., quarterback, running back, etc.).
         */
        var playersDocumentManager = (function() {
            var self = {};

            var documentManager = new DocumentManager("www.nfl.com/players/search?category=position&d-447263-p=1&filter=quarterback&conferenceAbbr=null&playerType=current&conference=ALL");

            self.process = function(position, callback) {
                documentManager.setParameter("filter", position);
                console.log("playersDocumentManager.process()" + " " + documentManager.getParameter("filter"));

                documentManager.processAndIterate(iterate, isComplete, callback);

                function iterate() {
                    documentManager.incrementParameter("d-447263-p");
                }

                function isComplete(result) {
                    return $(result).find("#result tr").has("td").length === 0;
                }
            };

            return self;
        })();

        /**
         * Parses an HTML document looking for high-level data on players (i.e., name, id, etc.)
         * @param  {object} doc     An HTML document
         * @return {object[]}       An array of player objects (NOTE: these player objects will NOT include any historical data)
         */
        var playersParser = (function() {
            var self = {};
            self.parse = function(doc) {
                console.log("playersParser.parse(\"" + position + "\")");

                if (doc === null || doc === undefined) {
                    return null;
                }

                // Parse players
                var unparsedPlayers = doc.find("#result tr").has("td");
                var parsedPlayers = $.map(unparsedPlayers, function(data, index) {
                    var element = $(data);
                    var team = element.find("td:eq(12)").text();
                    var position = element.find("td:eq(0)").text().replace(/[\r\n\s]+/gi, "");
                    var firstName = element.find("td:eq(2)").find("a").text().replace(/(.+), (.+)/gi, "$2");
                    var lastName = element.find("td:eq(2)").find("a").text().replace(/(.+), (.+)/gi, "$1");
                    var status = element.find("td:eq(3)").text();
                    var playerId = element.find("td:eq(2)").find("a").attr("href").replace(/\/player\/[^\/]+\/(\d+)\/profile/gi, "$1");

                    var parsedPlayer = new core.Player(playerId, firstName, lastName, team, position, status);

                    return parsedPlayer;
                });

                if (parsedPlayers.length === 0) {
                    return null;
                }

                return parsedPlayers;
            };

            return self;
        })();

        playersDocumentManager.process(position, function(err, results) {
            if (err) console.log("getPlayersByPosition()" + " " + "Error" + err);

            var players = [];
            for (var i in results) {
                var unparsedPlayers = results[i];

                var parsedPlayers = playersParser.parse(unparsedPlayers);

                if (parsedPlayers === null) {
                    console.log("null result, skipping"); //debugging
                    continue;
                }

                players = players.concat(parsedPlayers);
            }
            callback(err, players);
        });
    }

    /**
     * (async) Gets all the historical data for a specific player
     * @param  {object}   player    The original player object
     * @param  {Function} callback  The function to call when the action completes
     * @return {object}             A player object
     */

    function getSeasonsByPlayer(player, tmpStartingSeason, tmpEndingSeason, callback) {
        /**
         * Used to generate a series of URLs which can later be processed. More specifically, this instance iterates a specific player's season.
         */
        var playerSeasonDocumentManager = (function() {
            var self = {};

            var documentManager = new DocumentManager("www.nfl.com/player/dominiquedavis/2532829/gamelogs?season=1990");

            var player;
            var startingSeason;
            var endingSeason;

            self.process = function(tmpPlayer, tmpStartingSeason, tmpEndingSeason, callback) {
                player = tmpPlayer;
                startingSeason = tmpStartingSeason;
                endingSeason = tmpEndingSeason;

                documentManager.setSegment(2, player.lastName + player.firstName);
                documentManager.setSegment(3, player.id);
                documentManager.setParameter("season", endingSeason);
                console.log("playerSeasonDocumentManager.process()" + " " + documentManager.getSegment(0));

                documentManager.processAndIterate(iterate, isComplete, callback);

                function iterate() {
                    documentManager.decrementParameter("season");
                }

                function isComplete(iterationHandlerCallback) {
                    return $(iterationHandlerCallback).find("table").has("thead tr td:contains('Regular Season')").length === 0 || documentManager.getParameter("season") < startingSeason;
                }

            };

            return self;
        })();

        /**
         * Parses an HTML document looking historical player data (i.e., all the games for a specific season)
         */
        var playerSeasonParser = (function() {
            var self = {};

            /**
             * Parses an HTML document looking historical player data (i.e., all the games for a specific season)
             * @param  {object} doc     An HTML document
             * @return {object}         A player object with fully populated historical data
             */
            self.parse = function(doc) {
                console.log("playerSeasonParser.parse(\"" + player.firstName + " " + player.lastName + "\", " + doc.find("select#season option[selected]").text(), ")");
                if (doc === null || doc === undefined) {
                    return null;
                }

                // Parse season
                // var seasonIndex = doc.find("select#season option:selected").text();
                var seasonIndex = doc.find("select#season option[selected]").text();
                var season = new core.Season(seasonIndex);

                var regularSeasonTableElement = doc.find("table")
                    .has("thead tr td:contains('Regular Season')");

                // Parse point types
                var headerRow = regularSeasonTableElement.find("thead");
                var pointTypeCategories = _.reduce(headerRow.find("tr.player-table-header td"), function(memo, pointTypeCategory) {
                    var pointTypeCategoryElement = $(pointTypeCategory);
                    var colspan = parseInt(pointTypeCategoryElement.attr("colspan"), 10);
                    while (colspan--) {
                        memo.push(pointTypeCategoryElement.text().toLowerCase());
                    }

                    return memo;
                }, []);
                var pointTypes = headerRow.find("tr:not(.player-table-header) td").map(function(index, value) {
                    return $(value).text().toLowerCase();
                });

                // Parse games
                var unparsedGames = regularSeasonTableElement
                    .find("tbody tr")
                    .filter("tr:not(:has('.border-td')):not(:has('.player-totals'))");
                var parsedGames = $.map(unparsedGames, function(data, index) {
                    var element = $(data);

                    var gameIndex = element.find("td:eq(0)").text();
                    var gameYear = seasonIndex;
                    var gameMonth = element.find("td:eq(1)").text().replace(/(\d+)\/(\d+)/gi, "$1").replace(/[\r\n\s]+/gi, ""); // Remove carriage return, newline and whitespace characters
                    var gameDay = element.find("td:eq(1)").text().replace(/(\d+)\/(\d+)/gi, "$2").replace(/[\r\n\s]+/gi, ""); // Remove carriage return, newline and whitespace characters
                    var gameDate = gameMonth == "Bye" || gameDay == "Bye" ? "Bye" : new Date(gameYear, gameMonth, gameDay).toJSON().split("T")[0]; //Format as YYYY/MM/DD
                    var gameOpponent = element.find("td:eq(2)").text().replace(/\s/gi, "");
                    var gamePlayed = element.find("td:eq(4)").text().replace(/\s/gi, "");
                    var gameStarted = element.find("td:eq(5)").text().replace(/\s/gi, "");

                    var parsedGame = new core.Game(gameIndex, gameDate, gameOpponent, gamePlayed, gameStarted);
                    parsedGame.score.forTeam = parseInt(element.find("td:eq(3)").find("a").text().replace(/(\d+)\-(\d+)/gi, "$1"), 10) || 0; // Convert to int, or default to zero
                    parsedGame.score.againstTeam = parseInt(element.find("td:eq(3)").find("a").text().replace(/(\d+)\-(\d+)/gi, "$2"), 10) || 0; // Convert to int, or default to zero

                    var columns = element.find("td");
                    for (var i = 6; i < columns.length; i++) {
                        var pointTypeCategory = pointTypeCategories[i];
                        var pointType = pointTypes[i];

                        // If the pointTypeCategory doesn't exist, then create it
                        if (parsedGame.points[pointTypeCategory] === null || parsedGame.points[pointTypeCategory] === undefined) {
                            parsedGame.points[pointTypeCategory] = {};
                        }
                        parsedGame.points[pointTypeCategory][pointType] = parseInt(columns.eq(i).text().replace(/\-+/gi, "0"), 10) || 0;
                    }

                    return parsedGame;
                });

                if (parsedGames.length === 0) {
                    return null;
                }

                season.games = parsedGames;

                return season;
            };

            return self;
        })();

        // Iterate document managers to prepare a queue of URLs to be loaded and parsed;
        playerSeasonDocumentManager.process(player, tmpStartingSeason, tmpEndingSeason, function(err, results) {
            if (err) {
                console.log("getSeasonsByPlayer()" + " " + "Error" + err);
            }

            var playerSeasons = [];
            for (var i in results) {
                var unparsedSeason = results[i];

                var parsedPlayerSeason = playerSeasonParser.parse(unparsedSeason);

                if (parsedPlayerSeason === null) {
                    console.log("null result, skipping"); //debugging
                    continue;
                }

                playerSeasons = playerSeasons.concat(parsedPlayerSeason);
            }

            player.seasons = playerSeasons;
            callback(err, player);
        });
    }

    return {
        getSeasonsByPlayer: getSeasonsByPlayer,
        getPlayersByPosition: getPlayersByPosition
    };
});
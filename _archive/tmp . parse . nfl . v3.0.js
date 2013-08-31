/**
 * A Class that is used to generate a series of URLs which can later be processed.
 * @param {string} The base URL
 */

function DocumentManager(url) {
    "use strict";

    var uri = new URI(url);

    var self = {};

    self.getParameter = function(parameterName) {
        var search = uri.search(true);
        //console.log(parameterName +' : '+ search[parameterName]);
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
        var newParameterValue = self.hasParameter(parameterName) ? parseInt(self.getParameter(parameterName)) + magnitudeOfIncrement : 0;
        self.setParameter(parameterName, newParameterValue);
    };

    self.decrementParameter = function(parameterName) {
        var newParameterValue = self.hasParameter(parameterName) ? parseInt(self.getParameter(parameterName)) - 1 : 0;
        self.setParameter(parameterName, newParameterValue);
    };

    self.getSegment = function(segmentIndex) {
        return uri.segment(segmentIndex);
    };

    self.setSegment = function(segmentIndex, segmentValue) {
        uri.segment(segmentIndex, segmentValue);
    };

    var queue = [];
    var queueHandler = function(item, callback) {
        var url = item;
        console.log(url);
        $.ajax({
            dataType: 'json',
            url: url,
            cache: false
        })
            .done(function(data) {
                console.log('Request Succeeded: ' + data);
                callback(null, $(data.contents));
            })
            .fail(function(jqxhr, textStatus, error) {
                console.log('Request Failed: ' + error);
                var err = textStatus + ', ' + error;
                callback(err);
            });
    };

    self.processQueue = function(callback) {
        async.mapLimit(queue, 2, queueHandler, function(err, results) {
            if (err) {
                console.log('DocumentManager.processQueue()' + ' ' + 'Error' + err);
            }

            callback(err, results);
        });
    };

    self.queue = function() {
        console.log('DocumentManager.queue()' + ' ' + uri.toString());
        var url = 'http://anyorigin.com/get?url=' + encodeURIComponent(uri.toString()) + '&callback=?';

        queue.push(url);
    };

    return self;
};



/**
 * (async) Gets all the players who are in a specific position (i.e., quarterback, running-back, etc.)
 * @param  {string}   position  The position (i.e., quarterback, running-back, etc.)
 * @param  {Function} callback  The function to call when the action completes
 * @return {object[]}           An array of player objects
 */

function getPlayersByPosition(position, callback) {
    "use strict";

    /**
     * Used to generate a series of URLs which can later be processed. More specifically, this instance iterates a list of players based on their position on the field (i.e., quarterback, running back, etc.).
     */
    var playersDocumentManager = (function() {
        var self = {};

        var documentManager = DocumentManager('www.nfl.com/players/search?category=position&d-447263-p=1&filter=quarterback&conferenceAbbr=null&playerType=current&conference=ALL');

        self.initialize = function(position) {
            documentManager.setParameter('filter', position);
            documentManager.queue();
            console.log('playersDocumentManager.initialize()' + ' ' + documentManager.getParameter('filter'));
        };

        self.isComplete = function() {
            var pageNumber = parseInt(documentManager.getParameter('d-447263-p'));
            var maxPageNumber = 2;

            console.log('playersDocumentManager.isComplete()' + ' ' + pageNumber + ' / ' + maxPageNumber);

            return pageNumber > maxPageNumber;
        };

        self.increment = function(callback) {
            documentManager.incrementParameter('d-447263-p');
            documentManager.queue();
            console.log('playersDocumentManager.increment()' + ' ' + documentManager.getParameter('d-447263-p'));
        };

        self.process = function(callback) {
            documentManager.processQueue(callback);
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
            console.log('playersParser.parse()');

            if (doc == null || doc == undefined) {
                return null;
            }

            // Parse players
            var unparsedPlayers = doc.find('#result tr').has('td');
            var parsedPlayers = $.map(unparsedPlayers, function(data, index) {
                var element = $(data);
                var team = element.find('td:eq(12)').text();
                var position = element.find('td:eq(0)').text();
                var firstName = element.find('td:eq(2)').find('a').text().replace(/(.+), (.+)/gi, '$1');
                var lastName = element.find('td:eq(2)').find('a').text().replace(/(.+), (.+)/gi, '$2');
                var status = element.find('td:eq(3)').text();
                var playerId = element.find('td:eq(2)').find('a').attr('href').replace(/\/player\/[^\/]+\/(\d+)\/profile/gi, '$1');

                var parsedPlayer = Player(playerId, firstName, lastName, team, position, status);

                return parsedPlayer;
            });

            if (parsedPlayers.length === 0) {
                return null;
            }

            return parsedPlayers;
        };

        return self;
    })();


    // Iterate document managers to prepare a queue of URLs to be loaded and parsed;
    playersDocumentManager.initialize(position);
    while (!playersDocumentManager.isComplete()) {
        playersDocumentManager.increment();
    }

    // Process the URLs
    playersDocumentManager.process(function(err, results) {
        if (err) {
            console.log('getPlayersByPosition()' + ' ' + 'Error' + err);
        }

        var players = [];
        for (var i in results) {
            var unparsedPlayers = results[i];

            var parsedPlayers = playersParser.parse(unparsedPlayers);

            if (parsedPlayers == null) {
                console.log('null result, skipping'); //debugging
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
    "use strict";

    /**
     * Used to generate a series of URLs which can later be processed. More specifically, this instance iterates a specific player's season.
     */
    var playerSeasonDocumentManager = (function() {
        var self = {};

        var documentManager = DocumentManager('www.nfl.com/player/dominiquedavis/2532829/gamelogs?season=1990');

        var player;
        var startingSeason;
        var endingSeason;

        self.initialize = function(tmpPlayer, tmpStartingSeason, tmpEndingSeason) {
            player = tmpPlayer;
            startingSeason = tmpStartingSeason;
            endingSeason = tmpEndingSeason;

            documentManager.setSegment(2, player.lastName + player.firstName);
            documentManager.setSegment(3, player.id);
            documentManager.setParameter('season', startingSeason);
            documentManager.queue();
            console.log('playerSeasonDocumentManager.initialize()' + ' ' + documentManager.getSegment(0));
        };

        self.isComplete = function() {
            var season = parseInt(documentManager.getParameter('season'));

            console.log('playerSeasonDocumentManager.isComplete()' + ' ' + season + ' / ' + endingSeason);

            return season > endingSeason;
        };

        self.increment = function(callback) {
            documentManager.incrementParameter('season');
            documentManager.queue();
            console.log('playerSeasonDocumentManager.increment()' + ' ' + documentManager.getParameter('season'));
        };

        self.process = function(callback) {
            documentManager.processQueue(callback);
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
            console.log('playerSeasonParser.parse()');

            if (doc == null || doc == undefined) {
                return null;
            }

            // Parse players
            var seasonIndex = doc.find('select#season option:selected').text();
            var season = Season(seasonIndex);
            var unparsedGames = doc.find('table')
                .has("thead tr td:contains('Regular Season')")
                .find('tbody tr')
                .filter('tr:not(:has(".border-td")):not(:has(".player-totals"))');
            var parsedGames = $.map(unparsedGames, function(data, index) {
                var element = $(data);

                var gameIndex = element.find("td:eq(0)").text();
                var gameOpponent = element.find("td:eq(2)").text().replace(/\s/gi, '');
                var parsedGame = Game(gameIndex, gameOpponent);
                parsedGame.score.forTeam = parseInt(element.find('td:eq(3)').find('a').text().replace(/(\d+)\-(\d+)/gi, '$1')) || 0;
                parsedGame.score.againstTeam = parseInt(element.find('td:eq(3)').find('a').text().replace(/(\d+)\-(\d+)/gi, '$2')) || 0;
                parsedGame.points.passing.comp = parseInt(element.find("td:eq(6)").text().replace(/\-+/gi, '0'));
                parsedGame.points.passing.att = parseInt(element.find("td:eq(7)").text().replace(/\-+/gi, '0'));
                parsedGame.points.passing.pct = parseInt(element.find("td:eq(8)").text().replace(/\-+/gi, '0'));
                parsedGame.points.passing.yds = parseInt(element.find("td:eq(9)").text().replace(/\-+/gi, '0'));
                parsedGame.points.passing.avg = parseInt(element.find("td:eq(10)").text().replace(/\-+/gi, '0'));
                parsedGame.points.passing.td = parseInt(element.find("td:eq(11)").text().replace(/\-+/gi, '0'));
                parsedGame.points.passing.int = parseInt(element.find("td:eq(12)").text().replace(/\-+/gi, '0'));
                parsedGame.points.passing.sck = parseInt(element.find("td:eq(13)").text().replace(/\-+/gi, '0'));
                parsedGame.points.passing.scky = parseInt(element.find("td:eq(14)").text().replace(/\-+/gi, '0'));
                parsedGame.points.passing.rate = parseInt(element.find("td:eq(15)").text().replace(/\-+/gi, '0'));
                parsedGame.points.rushing.yds = parseInt(element.find("td:eq(17)").text().replace(/\-+/gi, '0'));
                //parsedGame.points.rushing.int = parseInt($(value).find(".stat_15").text().replace(/\-+/gi, '0'));
                //parsedGame.points.receiving.yds = parseInt($(value).find(".stat_21").text().replace(/\-+/gi, '0'));
                //parsedGame.points.receiving.td = parseInt($(value).find(".stat_22").text().replace(/\-+/gi, '0'));
                //parsedGame.points.misc.fumtd = parseInt($(value).find(".stat_29").text().replace(/\-+/gi, '0'));
                //parsedGame.points.misc.twopt = parseInt($(value).find(".stat_32").text().replace(/\-+/gi, '0'));
                parsedGame.points.fum.lost = parseInt(element.find("td:eq(20)").text().replace(/\-+/gi, '0'));

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
    playerSeasonDocumentManager.initialize(player, tmpStartingSeason, tmpEndingSeason);
    while (!playerSeasonDocumentManager.isComplete()) {
        playerSeasonDocumentManager.increment();
    }

    playerSeasonDocumentManager.process(function(err, results) {
        if (err) {
            console.log('getSeasonsByPlayer()' + ' ' + 'Error' + err);
        }

        var playerSeasons = [];
        for (var i in results) {
            var unparsedSeason = results[i];

            var parsedPlayerSeason = playerSeasonParser.parse(unparsedSeason);

            if (parsedPlayerSeason == null) {
                console.log('null result, skipping'); //debugging
                continue;
            }

            playerSeasons = playerSeasons.concat(parsedPlayerSeason);
        }

        player.seasons = playerSeasons
        callback(err, player);
    });
}
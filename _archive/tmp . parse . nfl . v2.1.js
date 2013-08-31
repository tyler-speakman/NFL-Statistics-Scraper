function Parser() {
    "use strict";

    var self = {};

    if (arguments.length === 1) {
        // Called with single config parameters (i.e., Parser(options)
        var options = arguments[0];
        self.initialize = options.initialize;
        self.isComplete = options.isComplete;
        self.increment = options.increment;
        self.parse = options.parse;
    } else if (arguments.length > 1) {
        // Called with separate parameters (i.e., Parser(isCompleteFunction, incrementFunction, parseFunction)
        self.initialize = arguments[0];
        self.isComplete = arguments[1];
        self.increment = arguments[2];
        self.parse = arguments[3];
    } else {
        throw 'Invalid parameters';
    }

    return self;
}

var DocumentManager = function(url) {
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
        //queue = queue.slice(1, 30); //debugging

        async.mapLimit(queue, 2, queueHandler, function(err, results) {
            callback(results);
        });
    };

    self.queue = function() {
        var url = 'http://anyorigin.com/get?url=' + encodeURIComponent(uri.toString()) + '&callback=?';

        queue.push(url);
    };

    return self;
};

var statDocumentManager = DocumentManager('fantasy.nfl.com/research/scoringleaders?position=O&sort=name&statCategory=stats&statSeason=2012&statType=weekStats&statWeek=1&offset=0')

var playerDocumentManager = DocumentManager('www.nfl.com/player/dominiquedavis/2532829/profile')

var seasonParser = Parser({
    initialize: function() {
        statDocumentManager.setParameter('statSeason', 2009);
        console.log('seasonParser.initialize()' + statDocumentManager.getParameter('statSeason'));
    },
    isComplete: function() {
        console.log('seasonParser.isComplete()' + statDocumentManager.getParameter('statSeason'));
        var season = statDocumentManager.getParameter('statSeason');

        return season > 2012;
    },
    increment: function(callback) {
        statDocumentManager.incrementParameter('statSeason');
        statDocumentManager.queue();
        console.log('seasonParser.increment()' + statDocumentManager.getParameter('statSeason'));
    },
    parse: function(doc) {
        console.log('seasonParser.parse()');

        // Parse season
        var seasonIndex = doc.find('.weekNav li.st-item .st-menu .selected').text().replace(' Season', ''); // The year
        var season = Season(seasonIndex)

        return season;
    }
});

var weekParser = Parser({
    //numberOfWeeks: 17,
    //numberOfPlayers: 20, //725,
    initialize: function() {
        statDocumentManager.setParameter('statWeek', 1);
        statDocumentManager.setParameter('offset', 0);
        //console.log('weekParser.initialize()' + statDocumentManager.getParameter('statWeek'));
    },
    isComplete: function() {
        //console.log('weekParser.isComplete()' + statDocumentManager.getParameter('statWeek'));
        var week = statDocumentManager.getParameter('statWeek');
        var playerPageOffset = statDocumentManager.getParameter('offset');

        return week > 17 && playerPageOffset > 20;
    },
    increment: function() {
        var week = statDocumentManager.getParameter('statWeek');
        var playerPageOffset = statDocumentManager.getParameter('offset');

        if (playerPageOffset <= 20) {
            statDocumentManager.incrementParameter('offset', 25);
        } else if (week <= 17) {
            statDocumentManager.setParameter('offset', 0);
            statDocumentManager.incrementParameter('statWeek');
        }

        statDocumentManager.queue();
        //console.log('weekParser.increment()' + statDocumentManager.getParameter('statWeek'));
    },
    parse: function(doc) {
        console.log('weekParser.parse()');

        var weekIndex = doc.find('.weekNav li.ww').filter('.selected').text();
        if (weekIndex == null || weekIndex == undefined || weekIndex == '') {
            debugger; //debugging
        }
        var weeks = doc.find('tr[class*="player"]').map(
            function(key, value) {
                // Parse week
                var playerId = $(value).find('.playerCard')[0].className.replace(/.*playerNameId\-([\d]+).*/gi, '$1');
                var opponent = $(value).find('.playerOpponent').text();
                var week = Week(playerId, weekIndex, opponent);
                week.points.passing.yds = parseInt($(value).find('.stat_5').text().replace('-', 0), 10);
                week.points.passing.td = parseInt($(value).find('.stat_6').text().replace('-', 0), 10);
                week.points.passing.int = parseInt($(value).find('.stat_7').text().replace('-', 0), 10);
                week.points.rushing.yds = parseInt($(value).find('.stat_14').text().replace('-', 0), 10);
                week.points.rushing.int = parseInt($(value).find('.stat_15').text().replace('-', 0), 10);
                week.points.receiving.yds = parseInt($(value).find('.stat_21').text().replace('-', 0), 10);
                week.points.receiving.td = parseInt($(value).find('.stat_22').text().replace('-', 0), 10);
                week.points.misc.fumtd = parseInt($(value).find('.stat_29').text().replace('-', 0), 10);
                week.points.misc.twopt = parseInt($(value).find('.stat_32').text().replace('-', 0), 10);
                week.points.fum.lost = parseInt($(value).find('.stat_30').text().replace('-', 0), 10);

                return week;
            });


        return weeks;
    }
});


function loadData(callback) {
    "use strict";

    // Initalize parsers

    // Iterate parsers (this just prepares the urls for parsing)
    seasonParser.initialize();
    while (!seasonParser.isComplete()) {
        weekParser.initialize();
        while (!weekParser.isComplete()) {
            weekParser.increment();
        }
        seasonParser.increment();
    }

    // Process the URLs
    statDocumentManager.processQueue(function(results) {
        for (var i in results) {
            var result = results[i];

            if (result == null || result == undefined) {
                console.log('null result, skipping'); //debugging
                continue;
            }

            console.log(i);
            var tmpSeason = seasonParser.parse(result);
            var tmpWeeks = weekParser.parse(result);

            var players = localStorage.getObject('players') || {};
            _(tmpWeeks).each(function(value, key) {
                var tmpWeek = value;

                if (tmpWeek.index == null || tmpWeek.index == undefined || tmpWeek.index == '') {
                    console.log('null result, skipping'); //debugging
                }

                var tmpPlayer = players[tmpWeek.playerId] || Player(tmpWeek.playerId);
                tmpPlayer.seasons[tmpSeason.index] = tmpPlayer.seasons[tmpSeason.index] || tmpSeason;
                tmpPlayer.seasons[tmpSeason.index].weeks[tmpWeek.index] = tmpPlayer.seasons[tmpSeason.index].weeks[tmpWeek.index] || tmpWeek

                players[tmpWeek.playerId] = tmpPlayer;


            });

            //players = _(players).extend(tmpPlayers);
            storageManager.storePlayers(players);
        }

        callback();
    });

}
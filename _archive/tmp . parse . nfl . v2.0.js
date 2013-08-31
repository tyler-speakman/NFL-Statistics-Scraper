Storage.prototype.setObject = function(key, value) {
    this.setItem(key, JSON.stringify(value));
}

Storage.prototype.getObject = function(key) {
    return JSON.parse(this.getItem(key));
}

function Week(index, opponent) {
    var self = {};

    self.index = index;
    self.opponent = opponent;
    self.points = {
        passing: {
            yds: 0,
            td: 0,
            int: 0
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

    return self;
}

function Season(year) {
    var self = {};

    self.year = year;
    self.weeks = {}

    return self;
}

function Player(id, name) {
    var self = {};

    self.id = id;
    self.name = name;
    self.seasons = {}

    return self;
}

function Parser() {
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
        throw "Invalid parameters";
    }

    return self;
}

var documentManager = (function() {
    var uri = new URI('fantasy.nfl.com/research/scoringleaders?position=O&sort=name&statCategory=stats&statSeason=2012&statType=weekStats&statWeek=1&offset=0');

    var self = {};

    self.getParameter = function(parameterName) {
        var search = uri.search(true);
        //console.log(parameterName +" : "+ search[parameterName]);
        return search[parameterName];
    };

    self.hasParameter = function(parameterName) {
        var parameterValue = self.getParameter(parameterName);
        return parameterValue != null && parameterValue != undefined;
    };

    self.setParameter = function(parameterName, parameterValue) {
        uri
            .removeSearch(parameterName)
            .addSearch(parameterName, parameterValue);
    };

    self.incrementParameter = function(parameterName, magnitudeOfIncrement) {
        magnitudeOfIncrement = magnitudeOfIncrement || 1
        var newParameterValue = self.hasParameter(parameterName) ? parseInt(self.getParameter(parameterName)) + magnitudeOfIncrement : 0;
        self.setParameter(parameterName, newParameterValue);
    };

    self.decrementParameter = function(parameterName) {
        var newParameterValue = self.hasParameter(parameterName) ? parseInt(self.getParameter(parameterName)) - 1 : 0;
        self.setParameter(parameterName, newParameterValue);
    };


    var goQueue = [];

    self.processGo = function(callback) {

    }

    self.go = function() {
        var url = 'http://anyorigin.com/get?url=' + encodeURIComponent(uri.toString()) + '&callback=?';

        self.goQueue.push(url);
        /*
        $.ajax({
            dataType: "json",
            url: url,
            cache: false
        })
        .done(function( data ) {
            debugger;
            callback($(data.contents));
        })
        .fail(function( jqxhr, textStatus, error ) {
            debugger;
            var err = textStatus + ', ' + error;
            console.log( "Request Failed: " + err);
        }); 
        */
        /*
        $.getJSON(
            url,
            function(data, textStatus, jqXHR) {
                debugger;
                callback($(data.contents));
            });
*/
    };

    return self;
})();

var storageManager = (function storageManager() {
    var self = {};

    self.getPlayers = function() {
        return localStorage.getObject('players') || {};
    }

    self.getPlayer = function(id) {
        var storedPlayers = self.getPlayers();
        return storedPlayers[id];
    }

    self.storePlayers = function(players) {
        localStorage.setObject('players', storedPlayers);
    }

    return self;
})();

var seasonParser = Parser({
    initialize: function() {
        console.log('seasonParser.initialize()' + documentManager.getParameter('statSeason'));
        documentManager.setParameter('statSeason', 2009);
        documentManager.go();
    },
    isComplete: function() {
        console.log('seasonParser.isComplete()' + documentManager.getParameter('statSeason'));
        var season = documentManager.getParameter('statSeason');

        return season > 2012;
    },
    increment: function(callback) {
        console.log('seasonParser.increment()' + documentManager.getParameter('statSeason'));
        documentManager.incrementParameter('statSeason');
    },
    parse: function(doc) {
        console.log('seasonParser.parse()' + documentManager.getParameter('statSeason'));
        var seasonYear = doc.find('.weekNav li.st-item .st-menu .selected').text().replace(' Season', '');
        return seasonYear;
    }
});

var weekParser = Parser({
    initialize: function() {
        console.log('weekParser.initialize()' + documentManager.getParameter('statWeek'));
        documentManager.setParameter('statWeek', 1);
        documentManager.go();
    },
    isComplete: function() {
        console.log('weekParser.isComplete()' + documentManager.getParameter('statWeek'));
        var week = documentManager.getParameter('statWeek');

        return week > 17;
    },
    increment: function() {
        console.log('weekParser.increment()' + documentManager.getParameter('statWeek'));
        documentManager.incrementParameter('statWeek');
    },
    parse: function(doc) {
        console.log('weekParser.parse()' + documentManager.getParameter('statWeek'));
        var weekIndex = doc.find('.weekNav li.ww').filter('.selected').text();
        return weekIndex;
    }
});

var playerParser = Parser({
    initialize: function() {
        console.log('playerParser.initialize()' + documentManager.getParameter('offset'));
        documentManager.setParameter('offset', 0);
        documentManager.go();
    },
    isComplete: function() {
        console.log('playerParser.isComplete()' + documentManager.getParameter('offset'));
        var playerPageOffset = documentManager.getParameter('offset');

        return playerPageOffset > 999;
    },
    increment: function() {
        console.log('playerParser.increment()' + documentManager.getParameter('offset'));
        documentManager.incrementParameter('offset', 25);
    },
    parse: function(doc) {
        console.log('playerParser.parse()' + documentManager.getParameter('offset'));
        var players = doc.find('tr[class*="player"]').map(
            function(key, value) {
                // Parse week
                var weekOpponent = $(value).find(".playerOpponent").text();
                var week = Week(weekIndex, weekOpponent);
                week.points.passing.yds = $(value).find(".stat_5").text().replace('-', 0);
                week.points.passing.td = $(value).find(".stat_6").text().replace('-', 0);
                week.points.passing.int = $(value).find(".stat_7").text().replace('-', 0);
                week.points.rushing.yds = $(value).find(".stat_14").text().replace('-', 0);
                week.points.rushing.int = $(value).find(".stat_15").text().replace('-', 0);
                week.points.receiving.yds = $(value).find(".stat_21").text().replace('-', 0);
                week.points.receiving.td = $(value).find(".stat_22").text().replace('-', 0);
                week.points.misc.fumtd = $(value).find(".stat_29").text().replace('-', 0);
                week.points.misc.twopt = $(value).find(".stat_32").text().replace('-', 0);
                week.points.fum.lost = $(value).find(".stat_30").text().replace('-', 0);

                //var statTotal = $(value).find(".statTotal").text();

                // Parse season
                var season = Season(seasonIndex)
                season.weeks[weekIndex] = week

                // Parse player
                var id = $(value).find(".playerCard")[0].className.replace(/.*playerNameId\-([\d]+).*/gi, "$1");
                var name = $(value).find(".playerNameFull").text();
                var player = storedPlayers[id] || Player(id, name);
                player.seasons[season.year] = season;

                return player;
            });

    }
});
/*
var players = localStorage.getObject('players') || {};
seasonParser.initialize();
weekParser.initialize();
playerParser.initialize();
while (!seasonParser.isComplete()) {
    var tmpSeason = seasonParser.parse();
    while (!weekParser.isComplete()) {
        var tmpWeek = weekParser.parse();
        while (!playerParser.isComplete()) {
            var tmpPlayers = playerParser.parse();
            players = _(players).extend(tmpPlayers);
            playerParser.increment();
            debugger;
        }
        weekParser.increment();
        debugger;
    }
    seasonParser.increment();
    debugger;
}

storageManager.storePlayers(players);
debugger;


var players = localStorage.getObject('players') || {};

function resultsParser(data, err) {
    var tmpSeason = seasonParser.parse(data);
    var tmpWeek = weekParser.parse(data);
    var tmpPlayers = playerParser.parse(data, tmpSeason, tmpWeek);
    players = _(players).extend(tmpPlayers);

    if (!playerParser.isComplete()) {
        playerParser.increment();
    }

    if (!playerParser.isComplete()) {
        playerParser.increment();
    }
}
storageManager.storePlayers(players);
*/

function complete(data, err) {
    if (err) {
        console.log(err);
    }

    console.log(data);
}



function parse(callback) {
    function handleParsedPlayers(data, err) {
        if (err) {
            console.log(err);
        }

        players = _(players).extend(data);
    }

    playerParser.parse(handleParsedPlayers);

    increment(callback);
}

function increment(callback) {
    if (!playerParser.isComplete()) {
        //Increment parser
        playerParser.increment();

        parse(complete);
        return;
    }

    if (!weekParser.isComplete()) {
        // Reset parsers
        playerParser.initialize();

        //Increment parser
        weekParser.increment();

        parse(complete);
        return;
    }

    if (!seasonParser.isComplete()) {
        // Reset parsers
        playerParser.initialize();
        weekParser.initialize();

        //Increment parser
        seasonParser.increment();

        parse(complete);
        return;
    }

    callback(false);
    return;
}

function initialize(callback) {
    seasonParser.initialize();
    weekParser.initialize();
    playerParser.initialize();

    parse(callback);
}


debugger;
var players = storageManager.getPlayers();
initialize(complete);
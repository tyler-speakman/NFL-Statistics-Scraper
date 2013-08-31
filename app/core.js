/**
 * A class representing an NFL player
 * @param {[type]} id
 * @param {[type]} firstName
 * @param {[type]} lastName
 * @param {[type]} position
 * @param {[type]} status
 */
function Player(id, firstName, lastName, team, position, status) {
    var self = {};

    self.id = id;
    self.firstName = firstName;
    self.lastName = lastName;
    self.position = position;
    self.status = status;
    self.team = team;
    self.seasons = [];

    return self;
}

/**
 * A class representing a single player's season statistics (i.e., 2012 season, 2013 season, etc.)
 * @param {int} index   The season year (i.e., 2012 season, 2013 season, etc.)
 */
function Season(index) {
   var self = {};

    self.index = index; // year
    self.games = [];

    return self;
}

/**
 * A class representing a single player's game statistics (i.e., game 1 of the 2012 season, etc.)
 * @param {int}     index       The game # (i.e., game 1 of the 2012 season, etc.)
 * @param {string}  opponent The opposing team's name (i.e., "@DAL" is an away game in Dallas, etc.)
 */
function Game(index, opponent) {
   var self = {};

    self.index = index;
    self.opponent = opponent;
    self.score = {
        forTeam: 0,
        againstTeam: 0
    };
    self.points = {
        passing: {comp: 0, att: 0, pct: 0, yds: 0, avg: 0, td: 0, int: 0, sck: 0, scky: 0, rate: 0 }, 
        rushing: {yds: 0, td: 0 }, 
        receiving: {yds: 0, td: 0 }, 
        misc: {fumtd: 0, twopt: 0 },
        fum: {lost: 0 }
    };

    return self;
}
function handleStart(e, progressHandler) {
    var selectedOption = $('#player-position option:selected');
    var value = selectedOption.text();

    var requestsForPlayersByPosition = {};
    if (value == 'all') {
        selectedOption.parents('#player-position')
            .find('option:not(:selected)')
            .each(function(index, option) {
                var position = $(option).text();
                requestsForPlayersByPosition[position] = (function(position) {
                    return function(callback) {
                        getPlayersByPosition(position, callback);
                        progressHandler.completeTask({
                            labels: ["getPlayersByPosition"]
                        });
                    };
                })(position);
                progressHandler.queueTask({
                    labels: ["getPlayersByPosition"]
                });
            });
    } else {
        requestsForPlayersByPosition[value] = function(callback) {
            getPlayersByPosition(value, callback);
            progressHandler.completeTask({
                labels: ["getPlayersByPosition"]
            });
        };
        progressHandler.queueTask({
            labels: ["getPlayersByPosition"]
        });
    }

    var startingSeason = $('#season-start').data('datepicker').getDate().getFullYear();
    var endingSeason = $('#season-end').data('datepicker').getDate().getFullYear();

    async.parallelLimit(requestsForPlayersByPosition, 1, function(err, results) {
        handlePlayersLoadedByPosition(err, results, startingSeason, endingSeason, progressHandler);
    });

}

function handlePlayersLoadedByPosition(err, results, startingSeason, endingSeason, progressHandler) {
    if (err) {
        console.log('handlePlayersLoadedByPosition()' + ' ' + 'Error' + err);
        return;
    }

    var positions = results;
    var requestsForSeasonsByPlayer = {};
    for (var position in positions) {
        var players = positions[position];
        // players = players.slice(0, 5); // For debugging purpose, just retrieve one player's data

        for (var i in players) {
            var player = players[i];
            requestsForSeasonsByPlayer[player.id] = (function(player) {
                return function(callback) {
                    getSeasonsByPlayer(player, startingSeason, endingSeason, callback);
                    progressHandler.completeTask({
                        labels: ["getSeasonsByPlayer"]
                    });
                };
            })(player);
            progressHandler.queueTask({
                labels: ["getSeasonsByPlayer"]
            });
        }
    }

    async.parallelLimit(requestsForSeasonsByPlayer, 1, function(err, results) {
        handleSeasonsLoadedByPlayer(err, results, "");
    });
}

function handleSeasonsLoadedByPlayer(err, results, position) {
    if (err) {
        console.log('handleSeasonsLoadedByPlayer()' + ' ' + 'Error' + err);
        return;
    }

    var serializedResults = JSON.stringify(results);
    //$('#results').text(serializedResults);
    var blob = new Blob([serializedResults], {
        type: "text/plain;charset=utf-8"
    });
    var fileName = "data" + "." + position + "." + (new Date()).toISOString().replace(/[^\d]+/gi, '') + ".json";
    saveAs(blob, fileName);
    /*
    var players = results;
    for(var i in players){
        var players = positions[i];
        
        JSON.stringify(players)
    }
    */
}

function ProgressHandler(tmpLabels) {
    var self = $('<div/>');

    var numberOfTasksCompleted = {};
    var numberOfTasksQueued = {};

    var labels = tmpLabels || ["DEFAULT"];
    _.each(labels, function(value, key, list) {
        numberOfTasksCompleted[value] = 0;
        numberOfTasksQueued[value] = 0;
    });

    function parseArgs() {
        if (arguments.length === 1 && typeof(arguments[0]) === "object") {
            return {
                count: arguments[0].count || 1,
                labels: arguments[0].labels || labels
            };
        } else {
            return {
                count: arguments.length > 0 && typeof(arguments[0]) === "number" ? arguments[0] : 1,
                labels: arguments.length > 1 ? [].slice.call(arguments, 1) : labels
            };
        }
    }

    self.completeTask = function() {
        var args = parseArgs.apply(null, arguments);

        _.each(args.labels, function(value, key, list) {
            numberOfTasksCompleted[value] += args.count;
        });

        self.trigger('completeTask', self.getProgress());
        self.trigger('change', self.getProgress());
    };

    self.queueTask = function() {
        var args = parseArgs.apply(null, arguments);

        _.each(args.labels, function(value, key, list) {
            numberOfTasksQueued[value] += args.count;
        });

        self.trigger('queueTask', self.getProgress());
        self.trigger('change', self.getProgress());
    };

    self.getNumberOfTasksCompleted = function() {
        var args = parseArgs.apply(null, arguments);

        return _.reduce(args.labels, function(memo, value) {
            return memo + numberOfTasksQueued[value];
        }, 0);
    };

    self.getNumberOfTasksQueued = function() {
        var args = parseArgs.apply(null, arguments);

        return _.reduce(args.labels, function(memo, value) {
            return memo + numberOfTasksCompleted[value];
        }, 0);
    };

    self.getProgress = function() {
        var args = parseArgs.apply(null, arguments);

        return _.reduce(args.labels, function(memo, value) {

            if (numberOfTasksQueued[value] === 0) {
                return memo;
            } else {
                return memo + (numberOfTasksCompleted[value] / numberOfTasksQueued[value]) / args.labels.length;
            }
        }, 0);
    };

    return self;

}



$('#scrape-button').click(function(e) {
    var progress = ProgressHandler(["getPlayersByPosition", "getSeasonsByPlayer"]);

    progress
        .on('queueTask', function(e, data) {
            console.log(data);
        }).on('completeTask', function(e, data) {
            console.log(data);
        }).on('change', function(e, data) {
            console.log(data);
            var progress = data * 100;
            var progressLabel = Math.round(progress * 10) / 10 + '%';
            $('#progress .progress-bar').width(progressLabel);
            $('#progress .progress-bar span').text(progressLabel + ' complete');
        });

    handleStart(e, progress);
});
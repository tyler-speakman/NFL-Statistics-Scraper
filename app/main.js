require.config({
    paths: {
        "d3": "../libs/d3.v3.min",
        "FileSaver": "../libs/FileSaver"
    },
    shim: {
        "d3": {
            exports: "d3"
        },
        "FileSaver": {
            exports: "saveAs"
        }        
    },
    urlArgs: "noCache=" + (new Date()).getTime() // This prevents caching -- it is useful for debugging, but can be turned off for production
});

// // Durandal 2.x assumes no global libraries. It will ship expecting 
// // Knockout and jQuery to be defined with requirejs. .NET 
// // templates by default will set them up as standard script
// // libs and then register them with require as follows: 
// define("jquery", function () { return jQuery; });
// define("knockout", ko);

define(["FileSaver","parser", "visualizer"], function(saveAs, parser, visualizer) {
    "use strict";
    
    function scrapeHandler(e, progressHandler) {
        var selectedOption = $("#player-position option:selected");
        var value = selectedOption.text();

        var requestsForPlayersByPosition = {};
        if (value == "all") {
            selectedOption.parents("#player-position")
                .find("option:not(:selected)")
                .each(function(index, option) {
                    var position = $(option).text();
                    requestsForPlayersByPosition[position] = (function(position) {
                        return function(callback) {
                            parser.getPlayersByPosition(position, callback);
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
                parser.getPlayersByPosition(value, callback);
                progressHandler.completeTask({
                    labels: ["getPlayersByPosition"]
                });
            };
            progressHandler.queueTask({
                labels: ["getPlayersByPosition"]
            });
        }

        var startingSeason = $("#season-start").data("datepicker").getDate().getFullYear();
        var endingSeason = $("#season-end").data("datepicker").getDate().getFullYear();

        async.parallelLimit(requestsForPlayersByPosition, 1, function(err, results) {
            handlePlayersLoadedByPosition(err, results, startingSeason, endingSeason, progressHandler);
        });
    }

    function handlePlayersLoadedByPosition(err, results, startingSeason, endingSeason, progressHandler) {
        if (err) {
            console.log("handlePlayersLoadedByPosition()" + " " + "Error" + err);
            return;
        }

        var positions = results;
        var requestsForSeasonsByPlayer = {};
        for (var position in positions) {
            var players = positions[position];
            // players = players.slice(0, 5); // For debugging purpose, just retrieve one player"s data

            for (var i in players) {
                var player = players[i];
                requestsForSeasonsByPlayer[player.id] = (function(player) {
                    return function(callback) {
                        parser.getSeasonsByPlayer(player, startingSeason, endingSeason, callback);
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

        async.parallelLimit(requestsForSeasonsByPlayer, 2, function(err, results) {
            handleSeasonsLoadedByPlayer(err, results, "");
        });
    }

    function handleSeasonsLoadedByPlayer(err, results, position) {
        if (err) {
            console.log("handleSeasonsLoadedByPlayer()" + " " + "Error" + err);
            return;
        }

        var serializedResults = JSON.stringify(results);
        serializedResults = serializedResults.replace(/(\\r|\\n)+/gi, ""); // Remove carriage return and newline characters
        //$("#results").text(serializedResults);
        var blob = new Blob([serializedResults], {
            type: "text/plain;charset=utf-8"
        });
        var fileName = "data" + "." + position + "." + (new Date()).toISOString().replace(/[^\d]+/gi, "") + ".json";
        saveAs(blob, fileName);
    }

    function ProgressHandler(tmpLabels) {
        var self = $("<div/>");

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

            self.trigger("completeTask", self.getProgress());
            self.trigger("change", self.getProgress());
        };

        self.queueTask = function() {
            var args = parseArgs.apply(null, arguments);

            _.each(args.labels, function(value, key, list) {
                numberOfTasksQueued[value] += args.count;
            });

            self.trigger("queueTask", self.getProgress());
            self.trigger("change", self.getProgress());
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


    (function() {
        initializeScrapeEventHandlers();
        initializeVisualizeEventHandlers();

        function initializeScrapeEventHandlers() {
            $("#scrape-button").click(function(e) {
                var progress = new ProgressHandler(["getPlayersByPosition", "getSeasonsByPlayer"]);

                progress
                    .on("queueTask", function(e, data) {}).on("completeTask", function(e, data) {}).on("change", function(e, data) {
                        var progress = data * 100;
                        var progressLabel = Math.round(progress * 10) / 10 + "%";
                        $("#progress .progress-bar").width(progressLabel);
                        $("#progress .progress-bar span").text(progressLabel + " complete");
                    });

                scrapeHandler(e, progress);
            });
        }

        function initializeVisualizeEventHandlers() {
            var holder = document.getElementById("file-upload");
            holder.ondragover = function() {
                return false;
            };
            holder.ondragend = function() {
                return false;
            };
            holder.ondrop = function(e) {
                e.preventDefault();
                var file = e.dataTransfer.files[0];
                var reader = new FileReader();
                reader.onload = function(event) {
                    var unparsedJson = eval("'" + event.target.result.replace(/'/gi, "\\'") + "'");
                    var parsedJson = JSON.parse(unparsedJson);
                    var players = _.map(parsedJson, function(value, key, list) {
                        return value;
                    });

                    console.log("loaded " + players.length + " players");
                    visualizer.visualizeData(players);
                };
                reader.readAsText(file);

                return false;
            };
        }
    })();
});
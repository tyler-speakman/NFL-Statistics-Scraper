require.config({
    baseUrl: "/app",
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

define(["frontend/storage", "parser", "frontend/visualizer", "ProgressHandler"], function(storage, parser, visualizer, ProgressHandler) {
    "use strict";

    function scrapeHandler(e, progressHandler) {
        var selectedOption = $("#player-position option:selected");
        var position = selectedOption.text();

        var requestsForPlayersByPosition = {};
        if (position == "all") {
            selectedOption.parents("#player-position")
                .find("option:not(:selected)")
                .each(function(index, option) {
                    var tmpPosition = $(option).text();
                    requestsForPlayersByPosition[tmpPosition] = (function(position) {
                        return function(callback) {
                            parser.getPlayersByPosition(tmpPosition, callback);
                            progressHandler.completeTask({
                                labels: ["getPlayersByPosition"],
                                message: "Loaded players in " + tmpPosition + " position."
                            });
                        };
                    })(position);
                    progressHandler.queueTask({
                        labels: ["getPlayersByPosition"]
                    });
                });
        } else {
            requestsForPlayersByPosition[position] = function(callback) {
                parser.getPlayersByPosition(position, callback);
                progressHandler.completeTask({
                    labels: ["getPlayersByPosition"],
                    message: "Loaded players in " + position + " position."
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

    function visualizeHandler(e) {
        var file = e.dataTransfer.files[0];
        var reader = new FileReader();
        reader.onload = function(event) {
            var unparsedJson = eval("'" + event.target.result.replace(/'/gi, "\\'") + "'");
            storage.saveToServer(unparsedJson).then(function() {
                debugger;
                console.log(arguments);
            });
            
            var parsedJson = JSON.parse(unparsedJson);

            var players = _.map(parsedJson, function(value, key, list) {
                return value;
            });

            console.log("loaded " + players.length + " players");
            visualizer.visualizeData(players);
        };
        reader.readAsText(file);
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
                            labels: ["getSeasonsByPlayer"],
                            message: "Loaded seasons for " + player.toString() + "."
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

        storage.saveToClient(results);
        storage.saveToServer(results);
    }

    function initializeScrapeEventHandlers() {
        $("#scrape-button").click(function(e) {
            var progress = new ProgressHandler(["getPlayersByPosition", "getSeasonsByPlayer"]);

            progress
                .on("queueTask", function(e, data) {}).on("completeTask", function(e, data) {}).on("change", function(e, data) {
                    var progress = data.progress * 100;
                    var progressLabel = Math.round(progress * 10) / 10 + "%";
                    $("#progress .progress-bar").width(progressLabel);
                    $("#progress .progress-bar span").text(progressLabel + ", \"" + data.message + "\"");
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

            visualizeHandler(e);

            return false;
        };
    }

    initializeScrapeEventHandlers();
    initializeVisualizeEventHandlers();
});
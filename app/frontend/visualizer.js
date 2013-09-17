define(["d3", "core", "math"], function(d3, core, mathEx) {
    "use strict";

    function redrawPlayerData(loadedData) {
        // console.log("redrawPlayerData()");
        var maxTotalPoints = mathEx.max(core.Player.prototype.getTotalPoints, loadedData);
        var maxNumberOfSeasons = mathEx.max(core.Player.prototype.getNumberOfSeasons, loadedData);
        var maxAveragePointsPerGame = mathEx.max(core.Player.prototype.getAveragePointsPerGame, loadedData);

        var STAGE_WIDTH = $("svg").width();
        var STAGE_HEIGHT = $("svg").height();
        var VARIABLE_RADIUS = 10;
        var BASE_RADIUS = 4;

        var svg = d3.select(document.getElementById("canvas"));

        // Initialize
        var filterDataForMarkers = loadedData;
        var markers = svg.selectAll("circle")
            .data(filterDataForMarkers);
        markers.enter().append("circle")
            .attr("r", 0)
            .attr("cx", 0)
            .attr("cy", 0)
            .attr("fill", "grey")
            .attr("stroke", "black")
            .attr("stroke-width", "0")
            .attr("stroke-dasharray", "2,2")
            .attr("opacity", 0.1)
            .append("svg:title")
            .text(core.Player.prototype.toStringSummary);

        // Update
        markers
            .transition().duration(111)
            .attr("r", function(player, index) {
                return maxTotalPoints === 0 ? 0 : core.Player.prototype.getTotalPoints(player) / maxTotalPoints * VARIABLE_RADIUS + BASE_RADIUS;
            })
            .attr("cx", function(player, index) {
                // Use this "jig" to reduce the number of markers that are overlapping
                var jig = core.Player.prototype.getPercentHash(player);
                jig = (jig < 0.5 ? jig * 2 * -1 : jig) * VARIABLE_RADIUS;
                return maxNumberOfSeasons === 0 ? 0 : core.Player.prototype.getNumberOfSeasons(player) / maxNumberOfSeasons * (STAGE_WIDTH - 2 * (VARIABLE_RADIUS + BASE_RADIUS)) + (VARIABLE_RADIUS + BASE_RADIUS) + jig;
            })
            .attr("cy", function(player, index) {
                return maxAveragePointsPerGame === 0 ? 0 : core.Player.prototype.getAveragePointsPerGame(player) / maxAveragePointsPerGame * (STAGE_HEIGHT - 2 * (VARIABLE_RADIUS + BASE_RADIUS)) + (VARIABLE_RADIUS + BASE_RADIUS);
            })
            .filter(function(player, index) {
                return core.Player.prototype.getAveragePointsPerGame(player) / maxAveragePointsPerGame >= 0.5;
            })
        // .attr("fill", "grey")
        .attr("stroke-width", function(player, index) {
            return core.Player.prototype.getLastSeasonPlayed(player) == 2012 ? 5 : 0;
        });
        //

        // Delete
        markers.exit()
            .remove();

        // Initialize
        var filterDataForLabels = _.where(filterDataForMarkers, function(value, index, list) {
            var player = value;
            return core.Player.prototype.getPlayerMomentum(player, index) > 0.5 && core.Player.prototype.getAveragePointsPerGame(player) / maxAveragePointsPerGame > 0.5;
        });
        var labels = svg.selectAll("text")
            .data(filterDataForLabels);
        labels
            .enter()
            .append("text")
            .text(function(player) {
                return player.lastName;
            })
            .attr("x", 0)
            .attr("y", 0)
            .attr("opacity", 0.5)
            .attr("font-family", "sans-serif")
            .attr("font-size", "12px")
            .attr("fill", "black")
            .append("svg:title")
            .text(core.Player.prototype.toStringSummary);

        // Update
        labels
            .transition().duration(111)
            .attr("x", function(player, index) {
                // Use this "jig" to reduce the number of markers that are overlapping
                var jig = core.Player.prototype.getPercentHash(player);
                jig = (jig < 0.5 ? jig * 2 * -1 : jig) * VARIABLE_RADIUS;
                return maxNumberOfSeasons === 0 ? 0 : core.Player.prototype.getNumberOfSeasons(player) / maxNumberOfSeasons * (STAGE_WIDTH - 2 * (VARIABLE_RADIUS + BASE_RADIUS)) + (VARIABLE_RADIUS + BASE_RADIUS) + jig - $(this).width() / 2;
            })
            .attr("y", function(player, index) {
                return maxAveragePointsPerGame === 0 ? 0 : core.Player.prototype.getAveragePointsPerGame(player) / maxAveragePointsPerGame * (STAGE_HEIGHT - 2 * (VARIABLE_RADIUS + BASE_RADIUS)) + (VARIABLE_RADIUS + BASE_RADIUS) - $(this).height() / 2;
            });

        // Delete
        labels.exit()
            .remove();

    }

    function run(availableData, loadedData) {
        console.log("run(" + loadedData.length + " / " + availableData.length + ")");

        var numberOfDataToLoadPerIteration = Math.min(2, availableData.length);
        while (numberOfDataToLoadPerIteration--) {
            loadedData.push(availableData.pop());
        }
        redrawPlayerData(loadedData);

        if (availableData.length > 0) {
            setTimeout(function() {
                run.call(null, availableData, loadedData);
            }, 111);
        }
    }

    function visualizeData(availableData) {
        console.log("visualizeData()");

        // Filter out null elements
        availableData = _.filter(availableData, function(element, index, list) {
            var isNull = element === null;
            var currentYear = (new Date()).getUTCFullYear();
            var isActive = currentYear - core.Player.prototype.getLastSeasonPlayed(element) <= 2;// Player was active in the last 3 years
            return !isNull && isActive;
        });

        // Sort data
        availableData = _.sortBy(availableData, function(element, index, list) {
            var player = element;
            return 1 / core.Player.prototype.getNumberOfSeasons(player);
        });

        var loadedData = [];

        setTimeout(function() {
            run.call(null, availableData, loadedData);
        }, 111);
    }

    return {
        visualizeData: visualizeData
    };
});
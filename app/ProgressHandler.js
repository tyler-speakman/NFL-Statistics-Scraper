define(function(){
	var self = {};

	self.ProgressHandler = function(tmpLabels) {
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
                    labels: arguments[0].labels || labels,
                    message: arguments[0].message || ""
                };
            } else {
                return {
                    count: arguments.length > 0 && typeof(arguments[0]) === "number" ? arguments[0] : 1,
                    labels: arguments.length > 1 ? [].slice.call(arguments, 1, 2) : labels,
                    message: arguments.length > 2 ? [].slice.call(arguments, 2, 3) : ""
                };
            }
        }

        self.completeTask = function() {
            var args = parseArgs.apply(null, arguments);

            _.each(args.labels, function(value, key, list) {
                numberOfTasksCompleted[value] += args.count;
            });

            self.trigger("completeTask", {
                progress: self.getProgress(),
                message: args.message
            });
            self.trigger("change", {
                progress: self.getProgress(),
                message: args.message
            });
        };

        self.queueTask = function() {
            var args = parseArgs.apply(null, arguments);

            _.each(args.labels, function(value, key, list) {
                numberOfTasksQueued[value] += args.count;
            });

            self.trigger("queueTask", {
                progress: self.getProgress(),
                message: args.message
            });
            self.trigger("change", {
                progress: self.getProgress(),
                message: args.message
            });
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

    return self.ProgressHandler;
})
define(["FileSaver"], function(saveAs) {
	"use strict";
	var self = {};

	self.saveToClient = function(data) {
		var serializedResults = JSON.stringify(data);
		serializedResults = serializedResults.replace(/(\\r|\\n)+/gi, ""); // Remove carriage return and newline characters
		//$("#results").text(serializedResults);
		var blob = new Blob([serializedResults], {
			type: "text/plain;charset=utf-8"
		});
		var fileName = "data" + "." + (new Date()).toISOString().replace(/[^\d]+/gi, "") + ".json";

		return saveAs(blob, fileName);
	};

	self.saveToServer = function(data) {
		return $.ajax({
			type: "POST",
			url: '/data',
			data: JSON.stringify(data),
			cache: false
		});
	};

	return self;
});
define(['fs', 'path', 'async'], function(fs, path, async) {
  'use strict';

	var myDataFilePath = path.resolve("./myData.json")
	console.log(myDataFilePath);

	// queues up a save action. Prevents file access collisions (hopefully)
	var saveQueue = async.queue(function(tmpData, callback) {
		fs.writeFile(myDataFilePath, JSON.stringify(tmpData), function(err) {
			if (err) {
				// throw err;
				console.log("error");
				console.log(err);
			}

			callback();
		});
	}, 1);

	function save(data) {
		console.log("storage.save()");

		saveQueue.push(data, function(err) {
			console.log('storage.save() : Saved');
		});
	}

	function load() {
		console.log("storage.load()");

		// Load existing data from a file if it exists
		if (fs.existsSync(myDataFilePath)) {
			var myDataUnparsed = fs.readFileSync(myDataFilePath);

			console.log('Loaded');

			return JSON.parse(myDataUnparsed);
		}
	}

	var exports = {};
	exports.save = save;
	exports.load = load;
	return exports;
});
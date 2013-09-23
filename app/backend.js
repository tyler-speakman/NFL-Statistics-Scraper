var requirejs = require('requirejs');

requirejs.config({
	nodeRequire: require,
	paths: {
	    app: '../app'
	}
});

requirejs(['backend/server', 'backend/router'], function(server, router) {
	'use strict';

	server.start(router);
});
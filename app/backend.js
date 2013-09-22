var requirejs = require('requirejs');

requirejs.config({nodeRequire: require});

requirejs(['backend/server', 'backend/router'], function(server, router) {
	'use strict';

	server.start(router);
});
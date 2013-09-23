var requirejs = require('requirejs');

requirejs.config({
	nodeRequire: require,
	baseUrl: '../',
	paths: {
	    // app: '../app',
	    // async: '../node_modules/async',
	    // connect: '../node_modules/connect',
	    // async: '../node_modules/gzippo',
	    // async: '../node_modules/lodash',
	    // async: '../node_modules/lru-cache',
	}	
});

requirejs(['backend/server', 'backend/router'], function(server, router) {
	'use strict';

	server.start(router);
});
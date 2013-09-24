var requirejs = require('requirejs');

requirejs.config({
	nodeRequire: require,
	paths: {
		'libs': '../libs',
		'libs/lodash': "../libs/lodash.min",
	},
	shim: {
		"lodash": {
			exports: "lodash"
		},
	},
});

requirejs(['backend/server', 'backend/router'], function(server, router) {
	'use strict';

	server.start(router);
});
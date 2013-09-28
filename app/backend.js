var requirejs = require('node_modules/requirejs');

requirejs.config({
	nodeRequire: require,
	paths: {
		'lodash': '../node_modules/lodash',
		'connect': '../node_modules/connect',
		'async': '../node_modules/async',
		'gzippo': '../node_modules/gzippo',
		'requirejs': '../node_modules/requirejs',
		'lru-cache': '../node_modules/lru-cache',

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
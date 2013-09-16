'use strict';
var flatiron = require('flatiron'),
  // director = require('director'),
  // winston = require('winston'),
  union = require('union'),
  connect = require('connect'),
  path = require('path');

var app = flatiron.app;

app
  .use(flatiron.plugins.http, {
    // HTTP options
    before: [
      // Try to match the request to well-defined route. If none exists, then continue to other handlers.
      function(req, res) {
        var found = app.router.dispatch(req, res);
        if (!found) {
          res.emit('next');
        }
      },
      // Provide access to all files (security? :P)
      connect.static(path.resolve('./')),
      // Provide access to all directories (security? :P)
      connect.directory(path.resolve('./'))
    ]
  });

app.router.get('/version', function() {
  this.res.writeHead(200, {
    'Content-Type': 'text/plain'
  });
  this.res.end('flatiron ' + flatiron.version);
});

app.router.post('/test', function() {
  console.log(this.req);
  this.res.writeHead(200, {
    'Content-Type': 'text/plain'
  });
  this.res.end(this.req);
});

app.start(8080, function() {
  console.log('http://localhost:8080/');
});
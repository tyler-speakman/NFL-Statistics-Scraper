'use strict';
var path = require('path'),
  union = require('union'),
  winston = require('winston'),
  connect = require('connect');
// director = require('director'),

var flatiron = require('flatiron'),
  app = flatiron.app;

// Set up app.config to use ./config.json to get and set configuration settings.
app.config.file({
  file: path.join(__dirname, 'config.json')
});

app
  .use(flatiron.plugins.http, {
    // HTTP options
    before: [
      // Try to match the request to well-defined route. If none exists, then continue to other handlers.
      function(req, res) {
        app.log.info(req.url + ':' + req.method, req.body);
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

app.router.path(/data/, function() {

  this.get(function(callback) {
    console.log(arguments);
    this.res.writeHead(200, {
      'content-type': 'text/plain'
    });
    this.res.end('name: ' + name);
  });

  this.get(/name\/:name/, function(name, callback) {
    console.log(arguments);
    this.res.writeHead(200, {
      'content-type': 'text/plain'
    });
    this.res.end('name: ' + name);
  });

  this.get(/position\/:position/, function(position, callback) {
    console.log(arguments);
    this.res.writeHead(200, {
      'content-type': 'text/plain'
    });
    this.res.end('position: ' + position);
  });

  // Now, when you post a body to the server, it will reply with a JSON
  // representation of the same body.
  this.post(function() {
    for (var i in this.req.body) {
      var player = new Player(this.req.body[i]);
      player.save();
    }

    this.res.json(200, this.req.body);
  });
});

// Start the server!
app.start(app.config.get('port') || 8080, function(err) {
  if (err) {
    throw err;
  }

  var addr = app.server.address();
  app.log.info('Listening on http://' + addr.address + ':' + addr.port);
});

var resourceful = require('resourceful');

var Player = resourceful.define('player', function() {
  this.use('memory');

  // this.array('players');

  this.timestamps();
});

// Creature.prototype.feed = function (food) {
//   this.belly.push(food);
// };
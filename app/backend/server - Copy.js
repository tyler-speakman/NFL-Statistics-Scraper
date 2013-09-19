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

  this.get(function() {
    this.res.writeHead(200, {
      'content-type': 'text/plain'
    });
    this.res.end('hello!');
  });
  // this.get(function(callback) {
  //   console.log(arguments);
  //   this.res.writeHead(200, {
  //     'content-type': 'text/plain'
  //   });
  //   this.res.end("!!");
  //   // var players = Player.all();
  //   // console.log(Player)
  //   // console.log(players)
  //   // this.res.end(JSON.stringify(players));
  // });

  // this.get(/name\/:name/, function(name, callback) {
  //   console.log(arguments);
  //   this.res.writeHead(200, {
  //     'content-type': 'text/plain'
  //   });
  //   this.res.end('name: ' + name);
  // });

  // this.get(/position\/:position/, function(position, callback) {
  //   console.log(arguments);
  //   this.res.writeHead(200, {
  //     'content-type': 'text/plain'
  //   });
  //   this.res.end('position: ' + position);
  // });

  // Now, when you post a body to the server, it will reply with a JSON
  // representation of the same body.
  this.post(function() {
    // console.log(this.req.body);
    // for (var i in this.req.body) {
    //   console.log(i+": "+this.req.body[i]);
    //   // var player = new Player(this.req.body[i]);
    //   // player.save();
    //   Player.create(this.req.body[i]);
    // }

    //this.res.json(200, this.req.body);
    // app.log.info('\nthis: ',this);
    app.log.info('\nthis.req.body: ',this.req.body);
    app.log.info('\nthis.req: ',this.req);
    var fullBody = '';
    this.req.on('data',function(chunk){app.log.info('\ndata: '+chunk.toString(),chunk);fullBody += chunk.toString();});
    this.req.on('end',function(){app.log.info('\nend',fullBody);});
    this.res.writeHead(200, {
      'content-type': 'text/plain'
    });
    this.res.end('hello!');
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
var path = require('path'),
  http = require('http'),
  connect = require('connect'),
  gzippo = require('gzippo'),
  _ = require('lodash');

var storage = require('./storage');

var myData = storage.load() || {};

var DATA_ROUTE_REGEXP = new RegExp(/^\/data(\/id=([\d]+)){0,1}(\/name=([\w]+)){0,1}(\/position=([\w]+)){0,1}$/i);


var app = connect()
  .use(connect.logger('dev'))
  .use(connect.static(path.resolve('./')))
  .use(connect.directory(path.resolve('./')))
  .use(gzippo.compress())
  .use(function(req, res, next) {
    // Check if this request is for the "data" route
    if (DATA_ROUTE_REGEXP.test(req.url)) {
      console.log("[200] " + req.method + " to " + req.url);

      switch (req.method) {

        case 'POST':
          handleDataRoutePost(req, res);
          break;

        case 'GET':
          handleDataRouteGet(req, res);
          break;

        default:
          break;
      }
    }
  });

// Start the server!
http.createServer(app).listen(8080, 'localhost', function(err) {
  if (err) {
    throw err;
  }

  console.log(arguments)
  console.log('Listening on http://localhost:8080/');
});



function handleDataRoutePost(req, res) {
  // Update existing data
  if (req.method == 'POST') {

    var fullBody = '';
    req.on('data', function(partialBody) {
      fullBody += partialBody.toString()
    });

    req.on('end', function() {
      var parsedFullBody = JSON.parse(fullBody);
      var arrayOfInstances = parsedFullBody;
      var hashtableOfInstances = _.reduce(parsedFullBody, function(memo, instance) {
        // console.log(instance.id);
        memo[instance.id] = instance;
        return memo;
      }, {});

      myData = _.extend(myData, hashtableOfInstances);

      storage.save(myData);

      res.writeHead(200, "OK", {
        'Content-Type': 'application/json'
      });
      res.end(JSON.stringify(myData));
    });
  }
}

function handleDataRouteGet(req, res) {
  // Select existing data
  var DATA_ROUTE_REGEXPExec = DATA_ROUTE_REGEXP.exec(req.url);
  if (DATA_ROUTE_REGEXPExec == null) throw "Unable to parse data route."

  var id = DATA_ROUTE_REGEXPExec[2];
  var name = DATA_ROUTE_REGEXPExec[4];
  var position = DATA_ROUTE_REGEXPExec[6];

  // console.log(_.keys(myData));
  var result;
  if ( !! id) {
    // http://localhost:8080/data/id=216
    console.log("id", id);
    result = myData[id];
  } else if ( !! name) {
    // http://localhost:8080/data/name=DavisFred
    console.log("name", name);
    result = [_.find(myData, function(value, key, list) {
      return value.lastName + value.firstName == name;
    })];
  } else if ( !! position) {
    // (i.e., http://localhost:8080/data/position=K)
    console.log("position", position);
    result = [_.filter(myData, function(value, key, list) {
      return value.position == position;
    })];
  } else {
    console.log("all");
    result = myData;
  }
  // console.log(result);
  // Return existing data
  res.writeHead(200, "OK", {
    'Content-Type': 'application/json'
  });
  res.end(JSON.stringify(result));
}
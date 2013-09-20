define(['path', 'lodash', 'LRU-Cache', 'backend/storage', 'core'], function(path, _, Cache, storage, core) {
  'use strict';

  var myData = storage.load() || {};
  var cache = Cache({
    max: 50,
    maxAge: 1000 * 60 * 60
  });

  var routes = [
    new Route({
      label: 'Data Route',
      pattern: new RegExp(/^\/data(\/(id|name|position)\/([\w\d]+))?$/i),
      get: function(req, res, params) {
        // Select existing data
        console.log('Route.get()', '"' + params.key + '"', '"' + params.value + '"');

        var result;

        // Check cache for existing result
        var cachedResult = cache.get(req.url);
        if (cachedResult != null && cachedResult != undefined) {
          console.log('Route.get()', 'found cached result')
          result = cachedResult;
        } else {
          console.log('Route.get()', 'processing new result')
          // Process result
          switch (params.key) {

            case 'id':
              // (i.e., http://localhost:8080/data/id=216)
              result = core.Players.prototype.getPlayerById(myData, params.value)
              break;

            case 'name':
              // (i.e., http://localhost:8080/data/name=DavisFred)
              result = core.Players.prototype.getPlayerByName(myData, params.value)
              break;

            case 'position':
              // (i.e., http://localhost:8080/data/position=K)
              result = core.Players.prototype.getPlayersByPosition(myData, params.value);
              break;

            default:
              // Select all
              console.log('Route.get()', 'all');
              result = myData;
              break;
          }

          // Update cache with new result
          if (params.key != '') {
            console.log('Route.get()', 'saving new result to cache')
            cache.set(req.url, result);
          }
        }

        // Return existing data
        res.writeHead(200, "OK", {
          'Content-Type': 'application/json'
        });
        res.end(JSON.stringify(result));
      },
      post: function(req, res, params) {
        // Update existing data
        console.log('Route.post()', '"' + params.key + '"', '"' + params.value + '"');

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
    })
  ];

  function go(req, res) {
    console.log('router.go()', '[200] ' + req.method + ' to ' + req.url);

    // Check if this request matches a managed route
    var route = _.find(routes, function(route, key, list) {
      // console.log('', route.pattern, req.url, route.pattern.test(req.url));
      return route.pattern.test(req.url);
    })

    // If this request is not a managed route, then explode
    if (route == null) throw "Unknown route."

    // If this request is a managed route, then 
    console.log('router.go()', 'Found route');
    route.go(req, res);
  }


  function Route(options) {
    var self = this;

    self.label = options.label;
    self.pattern = options.pattern || new RegExp('');
    self.get = options.get;
    self.post = options.post;
    self.put = options.put;
    self.delete = options.delete;

    return self;
  }
  Route.prototype.go = function(req, res) {
    console.log('Route.go()')
    var method = String(req.method).toLowerCase();
    var action = this[method];
    if (action == null | action == undefined) throw "Unhandled route."

    var dataRouteRegExpExec = this.pattern.exec(req.url);

    if (dataRouteRegExpExec == null) throw "Unable to parse data route."

    var params = {
      key: dataRouteRegExpExec[2] || '',
      value: dataRouteRegExpExec[3] || ''
    };

    action(req, res, params);
  }

  var exports = {};
  exports.go = go;
  return exports;
});
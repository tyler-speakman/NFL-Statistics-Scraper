define(['path', 'http', 'connect', 'gzippo'], function(path, http, connect, gzippo) {
  'use strict';

  function start(router) {
    console.log('server.start()')
    var app = connect()
      .use(connect.logger('dev'))
      .use(connect.static(path.resolve('./')))
      .use(connect.directory(path.resolve('./')))
      .use(gzippo.compress())
      .use(function(req, res, next) {
        console.log('')
        router.go(req, res);
      });

    // Start the server!
    http.createServer(app).listen(8080, 'localhost', function(err) {
      if (err) {
        throw err;
      }

      console.log('Listening on http://localhost:8080/');
    });
  }

  var exports = {};
  exports.start = start;
  return exports;

});
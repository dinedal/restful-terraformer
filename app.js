var http = require('http'),
    director = require('director');

var router = require('./lib/main').router;

var server = http.createServer(function(req, res) {
  router.dispatch(req, res, function(err) {
    if (err) {
      res.writeHead(404);
      res.end();
    }
  });
});

server.listen(8080);
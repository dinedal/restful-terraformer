(function() {
  var director, redis, router;

  redis = require('redis').createClient();

  director = require('director');

  router = new director.http.Router();

  router.get("/", function() {
    this.res.writeHead(200, {
      'Content-Type': 'text/plain'
    });
    return this.res.end('hello world\n');
  });

  exports.router = router;

}).call(this);

(function() {
  var director, redis, router, util;

  util = require('util');

  redis = require('redis').createClient();

  director = require('director');

  router = new director.http.Router().configure({
    async: true
  });

  router.param('zip', /(\d{5})/);

  router.post("/weather/:zip", function(zip, next) {
    this.res.writeHead(200, {
      'Content-Type': 'application/json'
    });
    return this.req.on("data", function(data) {
      this.res.end(("" + (util.inspect(data, false, 20))) + '\n');
      return next();
    });
  });

  exports.router = router;

}).call(this);

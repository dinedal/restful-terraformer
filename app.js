
// Setup Redis connection info
process.env['REDISTOGO_URL'] = process.env['REDISTOGO_URL'] || "redis://127.0.0.1:6379/";

/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , request = require('request');

var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.logger());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

// Routes

app.get('/', routes.index);
app.put('/check_all', routes.check_all_changes);
app.post('/weather/:zip', routes.change_weather);
app.get('/weather/', routes.list_all_changes);

// Heroku Port BS
process.env['PORT'] = process.env['PORT'] || 3000;

app.listen(process.env['PORT']);
console.log("Listening on port %d in %s mode", app.address().port, app.settings.env);

// Keep-alive hostname
process.env['KEEPALIVE_PORT'] = process.env['KEEPALIVE_PORT'] || app.address().port;
process.env['KEEPALIVE_HOST'] = process.env['KEEPALIVE_HOST'] || "localhost";

// App Keepalive / checking of changes
setInterval(function() {
  request.put("http://" + process.env['KEEPALIVE_HOST'] +
    ":" + process.env['KEEPALIVE_PORT'] + "/check_all");
},15000);
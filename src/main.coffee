util = require 'util'
redis = require('redis').createClient()

director = require('director')

router = new director.http.Router().configure({ async: true })

router.param('zip', /(\d{5})/);

router.post "/weather/:zip", (zip, next) ->
  this.res.writeHead 200, {
    'Content-Type': 'application/json'
  }
  this.req.on "data", (data) ->  
    this.res.end "#{util.inspect data, false, 20}" + '\n'
    next()

exports.router = router

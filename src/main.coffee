redis = require('redis').createClient()

director = require('director')

router = new director.http.Router()

router.get "/", ->
  this.res.writeHead(200, {
    'Content-Type': 'text/plain'
  })
  this.res.end('hello world\n')

exports.router = router

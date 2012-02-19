
# GET home page.

exports.index = (req, res) ->
  res.render('index', { title: 'Express' })

exports.change_weather = (req, res) ->
  zip = req.param("zip")
  # todo validate zip
  body = req.body
  console.log zip
  res.end()
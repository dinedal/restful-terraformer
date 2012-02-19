weather_changer = require ('../models/weather')


# GET home page.

exports.index = (req, res) ->
  res.render('index', { title: 'Express' })

# POST weather change

exports.change_weather = (req, res) ->
  params = {}
  if req.body?
    params.desired_temp = req.body.desired_temp
    params.url = req.body.url
    params.tolerance = req.body.tolerance
  params.zip = req.param("zip")
  weather_changer.emit "validate", params, (is_valid) ->
    unless is_valid
      res.send {success:false}, 400
    else
      weather_changer.emit "create", params
      res.send {success:true}, 200

exports.check_all_changes = (req, res) ->
  weather_changer.emit "check_all", (count) ->
    res.send {count: count}, 200
weather_changer = require ('../models/weather')


# GET home page.

exports.index = (req, res) ->
  res.render('index', { title: 'RESTful-Terraformer' })

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
      res.json {success:false}, 400
    else
      weather_changer.emit "create", params
      res.json {success:true}, 200

# PUT to start a check on all weather changes

exports.check_all_changes = (req, res) ->
  weather_changer.emit "check_all", (count) ->
    res.json {count: count}, 200

# GET all currently pending changes

exports.list_all_changes = (req, res) ->
  weather_changer.emit "all", (json_string) ->
    res.send json_string, {'Content-Type':"application/json"}, 200
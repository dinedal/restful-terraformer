(function() {
  var weather_changer;

  weather_changer = require('../models/weather');

  exports.index = function(req, res) {
    return res.render('index', {
      title: 'RESTful-Terraformer'
    });
  };

  exports.change_weather = function(req, res) {
    var params;
    params = {};
    if (req.body != null) {
      params.desired_temp = req.body.desired_temp;
      params.url = req.body.url;
      params.tolerance = req.body.tolerance;
    }
    params.zip = req.param("zip");
    return weather_changer.emit("validate", params, function(is_valid) {
      if (!is_valid) {
        return res.json({
          success: false
        }, 400);
      } else {
        weather_changer.emit("create", params);
        return res.json({
          success: true
        }, 200);
      }
    });
  };

  exports.check_all_changes = function(req, res) {
    return weather_changer.emit("check_all", function(count) {
      return res.json({
        count: count
      }, 200);
    });
  };

  exports.list_all_changes = function(req, res) {
    return weather_changer.emit("all", function(json_string) {
      return res.send(json_string, {
        'Content-Type': "application/json"
      }, 200);
    });
  };

}).call(this);

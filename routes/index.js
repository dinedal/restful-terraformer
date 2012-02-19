(function() {
  var weather_changer;

  weather_changer = require('../models/weather');

  exports.index = function(req, res) {
    return res.render('index', {
      title: 'Express'
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
        return res.send({
          success: false
        }, 400);
      } else {
        weather_changer.emit("create", params);
        return res.send({
          success: true
        }, 200);
      }
    });
  };

  exports.check_all_changes = function(req, res) {
    return weather_changer.emit("check_all", function(count) {
      return res.send({
        count: count
      }, 200);
    });
  };

}).call(this);

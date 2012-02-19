(function() {

  exports.index = function(req, res) {
    return res.render('index', {
      title: 'Express'
    });
  };

  exports.change_weather = function(req, res) {
    var body, zip;
    zip = req.param("zip");
    body = req.body;
    console.log(zip);
    return res.end();
  };

}).call(this);

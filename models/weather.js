(function() {
  var EventEmitter, WeatherChange, WeatherChanger, YQL, async, redis, request, url, util, wc,
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  redis = require('redis').createClient();

  YQL = require('yql');

  async = require('async');

  request = require('request');

  EventEmitter = require('events').EventEmitter;

  util = require('util');

  url = require('url');

  WeatherChange = (function() {

    function WeatherChange(_arg) {
      this.zip = _arg.zip, this.url = _arg.url, this.desired_temp = _arg.desired_temp, this.tolerance = _arg.tolerance;
      this.desired_temp = parseInt(this.desired_temp);
      this.tolerance = parseInt(this.tolerance) || 4;
    }

    WeatherChange.prototype.save = function() {
      return redis.sadd("weatherchanges", JSON.stringify(this));
    };

    WeatherChange.prototype.save_still_changing = function() {
      return redis.sadd("weatherchanges_still_changing", JSON.stringify(this));
    };

    WeatherChange.prototype.complete = function(cb) {
      var _this = this;
      return YQL.exec("SELECT * FROM weather.forecast WHERE location = " + this.zip, function(response) {
        var current_temp;
        current_temp = parseInt(response.query.results.channel.item.condition.temp);
        console.log("got current_temp " + current_temp + ", desired_temp is " + _this.desired_temp + " for " + _this.zip);
        if (current_temp <= (_this.desired_temp + _this.tolerance) && current_temp >= (_this.desired_temp - _this.tolerance)) {
          return cb(true);
        } else {
          return cb(false);
        }
      });
    };

    WeatherChange.prototype.post_success = function() {
      console.log("posting " + this.url);
      return request.post({
        url: this.url,
        timeout: 120000,
        json: JSON.stringify(this.message())
      }, function(error) {
        if (error) {
          return console.log("tried to POST " + this.url + ", got " + (util.inspect(error)));
        }
      });
    };

    WeatherChange.prototype.message = function() {
      return {
        message: "Weather change complete for " + this.zip + ", to " + this.desired_temp + ", within " + this.tolerance + " degrees farenheit"
      };
    };

    WeatherChange.prototype.validate = function() {
      if ((this.zip.match(/(\d{5})/) != null) && !isNaN(this.desired_temp) && (url.parse(this.url).protocol.match(/https?/) != null)) {
        return true;
      } else {
        return false;
      }
    };

    WeatherChange.from_json = function(json) {
      return new WeatherChange(JSON.parse(json));
    };

    return WeatherChange;

  })();

  WeatherChanger = (function(_super) {

    __extends(WeatherChanger, _super);

    function WeatherChanger() {
      this.on("create", this.create);
      this.on("check_all", this.check_all);
      this.on("validate", this.validate);
    }

    WeatherChanger.prototype.validate = function(params, cb) {
      return cb((new WeatherChange(params)).validate());
    };

    WeatherChanger.prototype.create = function(params) {
      return (new WeatherChange(params)).save();
    };

    WeatherChanger.prototype.check_all = function(cb) {
      var more;
      redis.scard("weatherchanges", function(err, result) {
        return cb(result);
      });
      more = true;
      return redis.get("checking", function(err, result) {
        if (result == null) {
          return redis.set("checking", "1", function(err, result) {
            return async.whilst((function() {
              return more;
            }), (function(cb) {
              return redis.spop("weatherchanges", function(err, result) {
                var change;
                if (result != null) {
                  change = WeatherChange.from_json(result);
                  console.log("checking " + change.zip);
                  return change.complete(function(success) {
                    console.log("got " + success);
                    if (success) {
                      change.post_success();
                    } else {
                      change.save_still_changing();
                    }
                    return cb();
                  });
                } else {
                  more = false;
                  return cb();
                }
              });
            }), function() {
              return redis.sunionstore("weatherchanges", ["weatherchanges", "weatherchanges_still_changing"], function() {
                redis.del("weatherchanges_still_changing");
                return redis.expire("checking", "10");
              });
            });
          });
        }
      });
    };

    return WeatherChanger;

  })(EventEmitter);

  wc = new WeatherChanger();

  module.exports = wc;

}).call(this);

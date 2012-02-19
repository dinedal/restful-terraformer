(function() {
  var EventEmitter, WeatherChange, WeatherChanger, YQL, async, redis, request, util, wc,
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  redis = require('redis').createClient();

  YQL = require('yql');

  async = require('async');

  request = require('request');

  EventEmitter = require('events').EventEmitter;

  util = require('util');

  WeatherChange = (function() {

    function WeatherChange(_arg) {
      this.zip = _arg.zip, this.url = _arg.url, this.desired_temp = _arg.desired_temp;
      this.tolerance = 2;
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
        console.log("got current_temp " + current_temp + ", desired_temp is " + _this.desired_temp);
        if (current_temp <= (_this.desired_temp + _this.tolerance) && current_temp >= (_this.desired_temp - _this.tolerance)) {
          return cb(true);
        } else {
          return cb(false);
        }
      });
    };

    WeatherChange.prototype.post_success = function() {
      return request.post({
        url: this.url,
        timeout: 120000,
        json: JSON.stringify(this.message())
      }, function() {});
    };

    WeatherChange.prototype.message = function() {
      return {
        message: "Weather change complete for " + this.zip + ", to " + this.desired_temp + ", within " + this.tolerance + " degrees farenheit"
      };
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
    }

    WeatherChanger.prototype.create = function(params) {
      return (new WeatherChange(params)).save();
    };

    WeatherChanger.prototype.check_all = function() {
      var more;
      more = true;
      return async.whilst((function() {
        return more;
      }), (function(cb) {
        return redis.spop("weatherchanges", function(err, result) {
          var change;
          console.log("popped");
          if (result != null) {
            change = WeatherChange.from_json(result);
            console.log("checking " + (util.inspect(change)));
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
          return redis.del("weatherchanges_still_changing");
        });
      });
    };

    return WeatherChanger;

  })(EventEmitter);

  wc = new WeatherChanger();

  module.exports = wc;

}).call(this);

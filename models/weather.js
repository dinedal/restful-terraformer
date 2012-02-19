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

    WeatherChange.prototype.complete = function(cb) {
      return YQL.exec("SELECT * FROM weather.forecast WHERE location = " + this.zip, function(response) {
        var current_temp;
        current_temp = parseInt(response.query.results.channel.item.condition.temp);
        if (current_temp <= (this.desired_temp + this.tolerance) && current_temp >= (this.desired_temp - this.tolerance)) {
          return cb(true);
        } else {
          return cb(false);
        }
      });
    };

    WeatherChange.prototype.post_success = function() {
      return request(this.url, function() {});
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
        console.log("pop");
        return redis.spop("weatherchanges", function(err, result) {
          var change;
          if (result != null) {
            change = WeatherChange.from_json(result);
            return change.complete(function(success) {
              if (success) change.post_success();
              return cb();
            });
          } else {
            more = false;
            return cb();
          }
        });
      }), function() {});
    };

    return WeatherChanger;

  })(EventEmitter);

  wc = new WeatherChanger();

  module.exports = wc;

}).call(this);

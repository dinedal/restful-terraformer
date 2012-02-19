(function() {
  var EventEmitter, WeatherChange, YQL, async, redis, request,
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  redis = require('redis').createClient();

  YQL = require('yql');

  async = require('async');

  request = require('request');

  EventEmitter = require('events').EventEmitter;

  WeatherChange = (function(_super) {

    __extends(WeatherChange, _super);

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

    WeatherChange.prototype.post_success = function(cb) {
      return request(this.url, function() {
        return redis;
      });
    };

    WeatherChange.all = function(cb) {
      return redis.smembers("weatherchanges", function(err, results) {
        var result;
        return cb((function() {
          var _i, _len, _results;
          _results = [];
          for (_i = 0, _len = results.length; _i < _len; _i++) {
            result = results[_i];
            _results.push(new WeatherChange(JSON.parse(result)));
          }
          return _results;
        })());
      });
    };

    WeatherChange.callback_all = function(cb) {
      return WeatherChange.all(function(all_changes) {
        return async.filter(all_changes, (function(change, cb) {
          return change.complete(cb);
        }), function(completed) {});
      });
    };

    return WeatherChange;

  })(EventEmitter);

}).call(this);

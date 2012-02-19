redis = require('redis').createClient()
YQL = require 'yql'
async = require 'async'
request = require 'request'
EventEmitter = require('events').EventEmitter

class WeatherChange extends EventEmitter
  constructor: ({@zip, @url, @desired_temp}) ->
    @tolerance = 2

  save: ->
    redis.sadd "weatherchanges", JSON.stringify @

  complete: (cb) ->
    YQL.exec "SELECT * FROM weather.forecast WHERE location = #{@zip}", (response) ->
      current_temp = parseInt(response.query.results.channel.item.condition.temp)
      if (current_temp <= (@desired_temp + @tolerance) and current_temp >= (@desired_temp - @tolerance))
        cb true
      else
        cb false

  post_success: (cb) ->
    request @url, () ->
      # No one cares if we didn't get there
      redis

  @all: (cb) ->
    redis.smembers "weatherchanges", (err, results) ->
      cb(new WeatherChange JSON.parse result for result in results)

  @callback_all: (cb) ->
    WeatherChange.all (all_changes) ->
      async.filter(all_changes, ((change, cb) ->
        change.complete cb
        ), (completed) ->

      )


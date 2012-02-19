redis = require('redis').createClient()
YQL = require 'yql'
async = require 'async'
request = require 'request'
EventEmitter = require('events').EventEmitter
util = require 'util'

class WeatherChange
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

  post_success: () ->
    request @url, () ->
      # No one cares if we didn't get there

  @from_json: (json) ->
    new WeatherChange JSON.parse json

class WeatherChanger extends EventEmitter
  constructor: ->
    @on "create", @create
    @on "check_all", @check_all

  create: (params) ->
    (new WeatherChange(params)).save()

  check_all: () ->
    more = true
    async.whilst (-> more), 
      ((cb) -> console.log "pop"; redis.spop "weatherchanges", (err, result) ->
        if result?
          change = WeatherChange.from_json(result)
          change.complete (success) ->
            change.post_success() if success
            cb()
        else
          more = false
          cb()
      ), ->

wc = new WeatherChanger()

module.exports = wc
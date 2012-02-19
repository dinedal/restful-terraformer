redis = require('redis').createClient()
YQL = require 'yql'
async = require 'async'
request = require 'request'
EventEmitter = require('events').EventEmitter
util = require 'util'
url = require 'url'

class WeatherChange
  constructor: ({@zip, @url, @desired_temp, @tolerance}) ->
    @desired_temp = parseInt @desired_temp
    @tolerance = parseInt(@tolerance) || 4

  save: ->
    redis.sadd "weatherchanges", JSON.stringify @

  save_still_changing: ->
    redis.sadd "weatherchanges_still_changing", JSON.stringify @

  complete: (cb) ->
    YQL.exec "SELECT * FROM weather.forecast WHERE location = #{@zip}", (response) =>
      current_temp = parseInt(response.query.results.channel.item.condition.temp)
      console.log "got current_temp #{current_temp}, desired_temp is #{@desired_temp} for #{@zip}"
      if (current_temp <= (@desired_temp + @tolerance) and current_temp >= (@desired_temp - @tolerance))
        cb true
      else
        cb false

  post_success: () ->
    console.log "posting #{@url}"
    request.post {url:@url, timeout:120000, json: JSON.stringify @message()}, (error) ->
      # Log errors if the occured
      console.log "tried to POST #{@url}, got #{util.inspect error}" if error

  message: ->
    {message: "Weather change complete for #{@zip}, to #{@desired_temp}, within #{@tolerance} degrees farenheit"}

  validate: ->
    if @zip.match(/(\d{5})/)? and !isNaN(@desired_temp) and url.parse(@url).protocol.match(/https?/)?
      true
    else
      false

  @from_json: (json) ->
    new WeatherChange JSON.parse json

class WeatherChanger extends EventEmitter
  constructor: ->
    @on "create", @create
    @on "check_all", @check_all
    @on "validate", @validate
    @on "all", @all

  validate: (params, cb) ->
    cb (new WeatherChange(params)).validate()

  create: (params) ->
    (new WeatherChange(params)).save()

  check_all: (cb) ->
    redis.scard "weatherchanges", (err, result) -> cb result
    more = true
    redis.get "checking", (err, result) ->
      unless result?
        redis.set "checking", "1", (err, result) ->
          async.whilst (-> more), 
            ((cb) -> redis.spop "weatherchanges", (err, result) ->
              if result?
                change = WeatherChange.from_json(result)
                console.log "checking #{change.zip}"
                change.complete (success) ->
                  console.log "got #{success}"
                  if success
                    change.post_success()
                  else
                    change.save_still_changing()
                  cb()
              else
                more = false
                cb()
            ), ->
              redis.sunionstore "weatherchanges", ["weatherchanges", "weatherchanges_still_changing"], ->
                redis.del "weatherchanges_still_changing"
                redis.expire "checking", "10"

  all: (cb) ->
    redis.sunion ["weatherchanges", "weatherchanges_still_changing"], (err, result) ->
      cb "[" + result.toString() + "]"

wc = new WeatherChanger()

module.exports = wc
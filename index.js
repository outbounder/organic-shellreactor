var shelljs = require("shelljs")
var fs = require('fs')
var path = require("path")
var async = require("async")

module.exports = function(plasma, config) {

  var constructChemicalFromCmd = function(value) {
    var argv = value.split(" ")
    var chemical = {
      type: argv.shift(),
      value: []
    }
    var memoKey = null
    for(var i = 0; i<argv.length; i++) {
      if(argv[i].indexOf("-") == 0) {
        memoKey = argv[i].substr(1)
        continue
      }
      if(memoKey) {
        if(!chemical[memoKey])
          chemical[memoKey] = []
        chemical[memoKey].push(argv[i])
      } else {
        chemical.value.push(argv[i])
      }
    }
    return chemical
  }

  var executeCommand = function(c, f, cmd, handler) {
    if(c.verbose)
      console.info("exec: "+cmd)
    if(typeof cmd == "function") {
      return cmd(c, function(r){
        handler(r, createNext(c, f))
      })
    }
    if(cmd.charAt(0) === "@") {
      var chemical = constructChemicalFromCmd(cmd.substr(1))
      for(var key in c)
        if(!chemical[key])
          chemical[key] = c[key]
      return plasma.emit(chemical, function(r){
        handler(r || chemical, createNext(c, f))
      })
    }
    var child = shelljs.exec(cmd, {async: true, silent: true})
    if(c.output)
      child.stdout.on('data', function(chunk){
        c.output.write(chunk)
      })
    if(c.error)
      child.stderr.on('data', function(chunk){
        c.error.write(chunk)
      })
    child.on("error", function(err){
      handler(err, createNext(c, f))
    })
    child.on("close", function(code){
      if(code != 0)
        handler(new Error(cmd), createNext(c, f))
      else
        handler(c, createNext(c, f))
    })
  }

  var createNext = function(c, f){
    return function(){
      if(arguments.length == 3) {
        var wrapperCommand = arguments[0]
        var commands = c.transformCommands?c.transformCommands(arguments[1]):arguments[1]
        if(Array.isArray(commands))
          commands = commands.join(" && ")
        var handler = arguments[2]
        return createNext(c,f)(wrapperCommand+" '"+commands+"'", handler)
      }

      if(arguments.length == 2) {
        if(typeof arguments[0] == "object" && !Array.isArray(arguments[0]) && typeof arguments[1] == "function")
          return arguments[1](arguments[0])
        if(typeof arguments[1] == "string" || Array.isArray(arguments[1])) {
          var wrapperCommand = arguments[0]
          var commands = c.transformCommands?c.transformCommands(arguments[1]):arguments[1]
          if(Array.isArray(commands))
            commands = commands.join(" && ")
          return createNext(c,f)(wrapperCommand+" '"+commands+"'", createNext(c, f))
        }
        if(typeof arguments[1] == "function") {
          var commands = arguments[0]
          var handler = arguments[1]
          if(typeof commands == "string")
            return executeCommand(c, f, commands, handler)
          if(Array.isArray(commands))
            return async.eachSeries(commands, function(cmd, next){
              executeCommand(c, f, cmd, function(r){
                if(r instanceof Error)
                  next(r)
                else
                  next()
              })
            }, function(err){
              if(err != null)
                handler(err, createNext(c, f))
              else
                handler(c, createNext(c, f))
            })
        }
      }

      if(arguments.length == 1) {
        var commands = arguments[0]
        if(typeof commands == "string")
          return executeCommand(c, f, commands, f)
        if(Array.isArray(commands))
          return async.eachSeries(commands, function(cmd, next){
            executeCommand(c, f, cmd, function(r){
              if(r instanceof Error)
                next(r)
              else
                next()
            })
          }, function(err){
            if(err != null)
              f(err, createNext(c, f))
            else
              f(c, createNext(c, f))
          })
        if(typeof commands == "object")
          return f(commands)
      }

      if(arguments.length == 0) {
        return f()
      }
    }
  } 

  var resolvePath = function(type) {
    if(config.reactions.indexOf("/") === 0 || config.reactions.indexOf(":\\") == 1)
      return path.join(config.reactions, type+".js")
    else
      return path.join(process.cwd(), config.reactions, type+".js")
  }
  
  plasma.on(config.reactOn, function(c, next){
    if(typeof config.reactions == "string")
      if(!fs.existsSync(resolvePath(c.value[0]))) return false // XXX
    if(typeof config.reactions == "object")
      if(!config.reactions[c.value[0]]) return false

    var f = function(r){
      if(r instanceof Error) return next && next(r)
      if(c.value[0]) {
        if(typeof config.reactions == "string") {
          var type = c.value.shift()
          var reaction = require(resolvePath(type))
          reaction(c, createNext(c, f))
        }
        if(typeof config.reactions == "object") {
          var type = c.value.shift()
          var reaction = config.reactions[type]
          if(typeof reaction == "string")
            reaction = require(reaction)
          reaction(c, createNext(c, f))  
        }
      } else
        next && next(r || c)
    }
    f(c)
  })
}

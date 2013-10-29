var shelljs = require("shelljs")
var fs = require('fs')
var path = require("path")

module.exports = function(plasma, config) {

  var constructChemicalFromCmd = function(value) {
    var argv = value.split(" ")
    var chemical = {
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
    console.info("exec: "+cmd)
    if(typeof cmd == "function") {
      return cmd(c, function(r){
        handler(r, createNext(c, f))
      })
    }
    if(cmd.charAt(0) === cmd.charAt(0).toUpperCase()) {
      var a = cmd.split("")
      a[0] = cmd.charAt(0).toLowerCase()
      cmd = a.join("")
      var chemical = constructChemicalFromCmd(cmd)
      for(var key in chemical)
        c[key] = chemical[key]
      return plasma.emit(c, function(r){
        handler(r, createNext(c, f))
      })
    }
    var child = shelljs.exec(cmd, {async: true, silent: true})
    if(c.output)
      child.stdout.pipe(c.output)
    if(c.error)
      child.stderr.pipe(c.error)
    child.on("error", function(err){
      handler(err, createNext(c, f))
    })
    child.on("close", function(code){
      handler({code: code}, createNext(c, f))
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
        if(typeof arguments[0] == "object" && typeof arguments[1] == "function")
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
                if(r.code)
                  next()
                else
                  next(new Error(cmd+" failed."))
              })
            }, function(err){
              handler({code: err==null?0:1, err: err}, createNext(c, f))
            })
        }
      }

      if(arguments.length == 1) {
        var commands = arguments[0]
        if(typeof commands == "string")
          return executeCommand(c, f, commands, f)
        if(Array.isArray(commands))
          return async.eachSeries(commands, function(cmd, next){
            executeCommand(c, f, cmd, function(){
              next()
            })
          }, function(err){
            f(err, createNext(c, f))
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
    return path.join(process.cwd(), config.reactions, type+".js")
  }
  
  plasma.on(config.reactOn, function(c, next){
    if(!fs.existsSync(resolvePath(c.value[0]))) return false // XXX

    var f = function(r){
      if(r instanceof Error) return next && next(r)
      if(r.code && r.code != 0) return next && next(r)
      if(c.value[0]) {
        fs.exists(resolvePath(c.value[0]), function(found){
          if(found) {
            var type = c.value.shift()
            var reaction = require(resolvePath(type))
            reaction(c, createNext(c, f))  
          } else {
            plasma.emit(c, next)
          }
        })
      } else
        next && next(r)
    }
    f(c)
  })
}

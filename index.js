var shelljs = require("shelljs")
module.exports = function(plasma, config) {
  plasma.on(config.reactOn, function(c, next){
    if(!c.commands) c.commands = []

    var f = function(r){
      if(r instanceof Error) return next && next(r)
      var type = c.value.shift()
      if(type) {
        c.type = type
        plasma.emit(c, f)
      } else {
        var cmd
        if(c.commandsWrapper)
          cmd = c.commandsWrapper+" '"+c.commands.join(" && ")+"'"
        else
          cmd = c.commands.join(" && ")
        var child = shelljs.exec(cmd, {async: true, silent: true})
        next && next(child)
      }
    }
    f(c)
  })
}

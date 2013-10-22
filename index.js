var shelljs = require("shelljs")
module.exports = function(plasma, config) {
  plasma.on(config.reactOn || "react", function(c, next){
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
        var child = shelljs.exec(cmd, {async: true, silent: true});
        if(c.stdout)
          child.stdout.pipe(c.stdout)
        if(c.stderr)
          child.stderr.pipe(c.stderr)
        child.on("exit", function(code){
          if(code == 0)
            next && next(c)
          else
            next && next(new Error("failed "+cmd))
        })
      }
    }
    f(c)
  })
}

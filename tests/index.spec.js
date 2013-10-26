describe("index", function(){
  var Plasma = require("organic").Plasma;
  var ShellReactor = require("../index")
  
  it("reacts and emits chemicals defined in value", function(next){
    var plasma = new Plasma()
    var instance = new ShellReactor(plasma,{reactOn: "react"})
    plasma.on("test", function(c){
      expect(c.value.length).toBe(0)
      expect(c.commands.length).toBe(0)
      next()
    })
    plasma.emit({
      type: "react",
      value: ["test"]
    })
  })

  it("wraps commands", function(next){
    var plasma = new Plasma()
    var instance = new ShellReactor(plasma,{reactOn: "react"})
    var streamBuffer = new (require("stream-buffers").WritableStreamBuffer)()
    plasma.emit({
      type: "react",
      value: [],
      commandsWrapper: "echo",
      commands: ["echo test", "echo test2"]
    },function(c){
      c.stdout.pipe(streamBuffer)
      c.on("close", function(code){
        streamBuffer.destroy()
        expect(code).toBe(0)
        expect(streamBuffer.getContentsAsString("utf8")).toBe("echo test && echo test2\n")
        next()
      })
    })
  })
})

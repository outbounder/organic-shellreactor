describe("example", function(){
  var Plasma = require("organic").Plasma;
  var ShellReactor = require("../index")
  
  it("triggers fake npm install", function(){
    var plasma = new Plasma()
    var reactor = new ShellReactor(plasma, {
      reactOn: "execute"
    })

    plasma.on("console.log value", function(c, next){
      next && next()
    })

    plasma.on("console.log commands", function(c, next){
      next && next()
    })

    plasma.on("start npm install", function(c, next){
      c.commands.push("echo INSTALL!")
      next && next()
    })

     var streamBuffer = new (require("stream-buffers").WritableStreamBuffer)()
    plasma.emit({
      type: "execute",
      value: ["console.log value", "console.log commands", "start npm install"]
    }, function(childProcess){
      childProcess.stdout.pipe(streamBuffer)
      childProcess.on("close", function(){
        expect(streamBuffer.getContentsAsString("utf8")).toBe("INSTALL!\n")
      })
    })    
  })
})

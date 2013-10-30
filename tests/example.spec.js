describe("example", function(){
  var Plasma = require("organic").Plasma;
  var ShellReactor = require("../index")
  
  it("triggers fake example", function(next){

    var streamBuffer = new (require("stream-buffers").WritableStreamBuffer)()
    var plasma = new Plasma()
    var reactor = new ShellReactor(plasma, {
      reactOn: "execute",
      reactions: {
        "reaction1": function(c, next){
          next(["echo test", "@other -propertyName test"])
        }
      }
    })

    plasma.on("other", function(c, next){
      c.output.write(c.propertyName)
      next && next()
    })

    plasma.emit({
      type: "execute",
      value: ["reaction1"],
      output: streamBuffer
    }, function(r){
      expect(r instanceof Error).toBe(false)
      expect(streamBuffer.getContentsAsString("utf8")).toBe("test\ntest")
      next()
    })
  })
})

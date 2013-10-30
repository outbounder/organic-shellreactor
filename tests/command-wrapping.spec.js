describe("command wrapping", function(){
  var Plasma = require("organic").Plasma;
  var ShellReactor = require("../index")

  it("reacts and wraps command properly", function(next){
    var plasma = new Plasma()
    var streamBuffer = new (require("stream-buffers").WritableStreamBuffer)()
    var instance = new ShellReactor(plasma,{reactOn: "react", reactions:{
      test: function(c, next){
        expect(c.value.length).toBe(0)
        next("echo ","a command")  
      }
    }})

    plasma.emit({
      type: "react",
      value: ["test"],
      output: streamBuffer
    }, function(r){
      expect(streamBuffer.getContentsAsString("utf8")).toBe("a command\n")
      next()
    })
  })

  it("reacts and wraps array of commands properly", function(next){
    var plasma = new Plasma()
    var streamBuffer = new (require("stream-buffers").WritableStreamBuffer)()
    var instance = new ShellReactor(plasma,{reactOn: "react", reactions:{
      test: function(c, next){
        expect(c.value.length).toBe(0)
        next("echo ",["a command","with value"])  
      }
    }})

    plasma.emit({
      type: "react",
      value: ["test"],
      output: streamBuffer
    }, function(r){
      expect(streamBuffer.getContentsAsString("utf8")).toBe("a command && with value\n")
      next()
    })
  })

  it("reacts and wraps command properly while waiting for result", function(next){
    var plasma = new Plasma()
    var streamBuffer = new (require("stream-buffers").WritableStreamBuffer)()
    var instance = new ShellReactor(plasma,{reactOn: "react", reactions:{
      test: function(c, next){
        expect(c.value.length).toBe(0)
        next("echo ","a command", function(c, next){
          expect(streamBuffer.getContentsAsString("utf8")).toBe("a command\n")
          next()
        })  
      }
    }})

    plasma.emit({
      type: "react",
      value: ["test"],
      output: streamBuffer
    }, function(r){
      expect(r instanceof Error).toBe(false)
      next()
    })
  })
})
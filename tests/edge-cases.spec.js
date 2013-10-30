describe("custom edge cases", function(){

  var Plasma = require("organic").Plasma;
  var ShellReactor = require("../index")

  it("reacts with shell command and reads its output to know what should be triggerd next", function(next){
    var plasma = new Plasma()
    var streamBuffer = new (require("stream-buffers").WritableStreamBuffer)()
    var instance = new ShellReactor(plasma,{reactOn: "react", reactions:{
      test: function(c, next){
        var oldOutput = c.output
        c.output = new (require("stream-buffers").WritableStreamBuffer)()
        next("echo test", function(r, next){
          expect(c.output.getContentsAsString("utf8")).toBe("test\n")
          c.output = oldOutput
          next()
        })
      }
    }})

    plasma.emit({
      type: "react",
      value: ["test"],
      output: streamBuffer
    }, function(r){
      expect(streamBuffer.getContentsAsString("utf8")).toBe(false)
      next()
    })
  })

  it("drain reaction arguments from value", function(next){
    var plasma = new Plasma()
    var streamBuffer = new (require("stream-buffers").WritableStreamBuffer)()
    var instance = new ShellReactor(plasma,{reactOn: "react", reactions:{
      test: function(c, next){
        next("echo "+c.value.shift())
      }
    }})

    plasma.emit({
      type: "react",
      value: ["test","arg1"],
      output: streamBuffer
    }, function(r){
      expect(streamBuffer.getContentsAsString("utf8")).toBe("arg1\n")
      next()
    })
  })

  it("passes control flow to second reactor", function(next){
    var plasma = new Plasma()
    var streamBuffer = new (require("stream-buffers").WritableStreamBuffer)()
    var instance = new ShellReactor(plasma,{reactOn: "react", reactions:{
      test: function(c, next){
        next("echo "+c.value.shift())
      }
    }})

    var instance2 = new ShellReactor(plasma,{reactOn: "react", reactions:{
      test2: function(c, next){
        next("echo "+c.value.shift())
      }
    }})

    plasma.emit({
      type: "react",
      value: ["test","arg1","test2","arg2"],
      output: streamBuffer
    }, function(r){
      expect(streamBuffer.getContentsAsString("utf8")).toBe("arg1\narg2\n")
      next()
    })
  })
})
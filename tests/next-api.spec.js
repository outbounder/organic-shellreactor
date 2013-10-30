describe("next-api", function(){

  var Plasma = require("organic").Plasma;
  var ShellReactor = require("../index")
  
  it("invokes single command", function(next){
    var plasma = new Plasma()
    var streamBuffer = new (require("stream-buffers").WritableStreamBuffer)()
    var instance = new ShellReactor(plasma,{reactOn: "react", reactions:{
      test: function(c, next){
        next("echo test")
      }
    }})

    plasma.emit({
      type: "react",
      value: ["test"],
      output: streamBuffer
    }, function(r){
      expect(streamBuffer.getContentsAsString("utf8")).toBe("test\n")
      next()
    })
  })

  it("invokes array of commands", function(next){
    var plasma = new Plasma()
    var streamBuffer = new (require("stream-buffers").WritableStreamBuffer)()
    var instance = new ShellReactor(plasma,{reactOn: "react", reactions:{
      test: function(c, next){
        next(["echo test", "echo bla"])
      }
    }})

    plasma.emit({
      type: "react",
      value: ["test"],
      output: streamBuffer
    }, function(r){
      expect(streamBuffer.getContentsAsString("utf8")).toBe("test\nbla\n")
      next()
    })
  })

  it("invokes single command and handles it result", function(next){
    var plasma = new Plasma()
    var streamBuffer = new (require("stream-buffers").WritableStreamBuffer)()
    var instance = new ShellReactor(plasma,{reactOn: "react", reactions:{
      test: function(c, next){
        next("echo bla", function(c, n){
          expect(streamBuffer.getContentsAsString("utf8")).toBe("bla\n")
          n()
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

  it("invokes array of commands and handles their result", function(next){
    var plasma = new Plasma()
    var streamBuffer = new (require("stream-buffers").WritableStreamBuffer)()
    var instance = new ShellReactor(plasma,{reactOn: "react", reactions:{
      test: function(c, next){
        next(["echo bla", "echo test"], function(c, n){
          expect(streamBuffer.getContentsAsString("utf8")).toBe("bla\ntest\n")
          n()
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

  it("invokes array of commands with custom functions and handles their result", function(next){
    var plasma = new Plasma()
    var streamBuffer = new (require("stream-buffers").WritableStreamBuffer)()
    var instance = new ShellReactor(plasma,{reactOn: "react", reactions:{
      test: function(c, next){
        next(["echo bla", function(c, n){
          c.output.write("halo")
          n()
        },"echo test"], function(c, n){
          expect(streamBuffer.getContentsAsString("utf8")).toBe("bla\nhalotest\n")
          n()
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

  it("transforms command to chemical emitted in plasma", function(next){
    var plasma = new Plasma()
    var streamBuffer = new (require("stream-buffers").WritableStreamBuffer)()
    var instance = new ShellReactor(plasma,{reactOn: "react", reactions:{
      test: function(c, next){
        next("@echo")
      }
    }})

    plasma.on("echo", function(c, n){
      c.output.write("test\n")
      n()
    })

    plasma.emit({
      type: "react",
      value: ["test"],
      output: streamBuffer
    }, function(r){
      expect(streamBuffer.getContentsAsString("utf8")).toBe("test\n")
      next()
    })
  })

  it("transforms array of commands to chemical emitted in plasma", function(next){
    var plasma = new Plasma()
    var streamBuffer = new (require("stream-buffers").WritableStreamBuffer)()
    var instance = new ShellReactor(plasma,{reactOn: "react", reactions:{
      test: function(c, next){
        next(["@echo", "@echo2"])
      }
    }})

    plasma.on("echo", function(c, n){
      c.output.write("test\n")
      n()
    })

    plasma.on("echo2", function(c, n){
      c.output.write("test2\n")
      n()
    })

    plasma.emit({
      type: "react",
      value: ["test"],
      output: streamBuffer
    }, function(r){
      expect(streamBuffer.getContentsAsString("utf8")).toBe("test\ntest2\n")
      next()
    })
  })

  it("transforms command to chemical emitted in plasma and captures it result", function(next){
    var plasma = new Plasma()
    var streamBuffer = new (require("stream-buffers").WritableStreamBuffer)()
    var instance = new ShellReactor(plasma,{reactOn: "react", reactions:{
      test: function(c, next){
        next("@echo", function(r, n){
          expect(r.test).toBe(true)
          n()
        })
      }
    }})

    plasma.on("echo", function(c, n){
      c.output.write("test\n")
      c.test = true
      n()
    })

    plasma.emit({
      type: "react",
      value: ["test"],
      output: streamBuffer
    }, function(r){
      expect(streamBuffer.getContentsAsString("utf8")).toBe("test\n")
      next()
    })
  })

  it("transforms command to chemical emitted in plasma and invokes next reactions", function(next){
    var plasma = new Plasma()
    var streamBuffer = new (require("stream-buffers").WritableStreamBuffer)()
    var instance = new ShellReactor(plasma,{reactOn: "react", reactions:{
      test: function(c, next){
        next("@echo", function(r, n){
          expect(r.test).toBe(true)
          n()
        })
      },
      test2: function(c, next){
        next("@echo", function(r, n){
          expect(r.test).toBe(true)
          n()
        })
      }
    }})

    plasma.on("echo", function(c, n){
      c.output.write("test\n")
      c.test = true
      n()
    })

    plasma.emit({
      type: "react",
      value: ["test", "test2"],
      output: streamBuffer
    }, function(r){
      expect(streamBuffer.getContentsAsString("utf8")).toBe("test\ntest\n")
      next()
    })
  })
})
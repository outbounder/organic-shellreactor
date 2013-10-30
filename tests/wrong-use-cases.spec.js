describe("wrong use cases", function(){
  var Plasma = require("organic").Plasma;
  var ShellReactor = require("../index")
  
  it("doesn't captures if reaction is not found", function(next){
    var plasma = new Plasma()

    var instance = new ShellReactor(plasma,{reactOn: "react", reactions:{
      test: function(c, next){
        throw new Error("should not happen")
      }
    }})

    plasma.on("react", function(c){
      expect(c.value.length).toBe(1)
      expect(c.value[0]).toBe("test2")
      next()
    })

    plasma.emit({
      type: "react",
      value: ["test2"]
    })
  })

  it("returns error when shell command is not found", function(next){
    var plasma = new Plasma()

    var instance = new ShellReactor(plasma,{reactOn: "react", reactions:{
      test: function(c, next){
        next(["notfound_command"])  
      }
    }})

    plasma.emit({
      type: "react",
      value: ["test"]
    }, function(r){
      expect(r instanceof Error).toBe(true)
      next()
    })
  })

  it("returns error when shell command is not found and doesn't invoke next", function(next){
    var plasma = new Plasma()

    var instance = new ShellReactor(plasma,{reactOn: "react", reactions:{
      test: function(c, next){
        next(["notfound_command", "echo test"])  
      }
    }})

    plasma.emit({
      type: "react",
      value: ["test"],
      output: {
        write: function(){
          throw new Error("should not happen")
        }
      }
    }, function(r){
      expect(r instanceof Error).toBe(true)
      expect(r.message).toContain("notfound_command")
      next()
    })
  })

  it("returns the error produced from emitting chemical to plasma", function(next){
    var plasma = new Plasma()

    var instance = new ShellReactor(plasma,{reactOn: "react", reactions:{
      test: function(c, next){
        next(["@notfound_command", "echo test"])  
      }
    }})

    plasma.on("notfound_command", function(c, next){
      next(new Error("notfound_command"))
    })

    plasma.emit({
      type: "react",
      value: ["test"],
      output: {
        write: function(){
          throw new Error("should not happen")
        }
      }
    }, function(r){
      expect(r instanceof Error).toBe(true)
      expect(r.message).toContain("notfound_command")
      next()
    })
  })

  it("returns error from plasma reaction and doesn't call any next reactions", function(next){
    var plasma = new Plasma()

    var instance = new ShellReactor(plasma,{reactOn: "react", reactions:{
      test: function(c, next){
        next(["@notfound_command", "echo test"])  
      },
      test2: function(){
        throw new Error("should not happen")
      }
    }})

    plasma.on("notfound_command", function(c, next){
      next(new Error("notfound_command"))
    })

    plasma.emit({
      type: "react",
      value: ["test", "test2"],
      output: {
        write: function(){
          throw new Error("should not happen")
        }
      }
    }, function(r){
      expect(r instanceof Error).toBe(true)
      expect(r.message).toContain("notfound_command")
      next()
    })
  })

  it("doesn't throws exception when wrong chemical structure is provided", function(next){
    var plasma = new Plasma()

    var instance = new ShellReactor(plasma,{reactOn: "react", reactions:{
      test: function(c, next){
        throw new Error("should not happen")
      }
    }})

    plasma.on("react", function(c){
      expect(c.value).toBe("test")
      next()
    })

    plasma.emit({
      type: "react",
      value: "test"
    })
  })

})

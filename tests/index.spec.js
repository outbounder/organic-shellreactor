describe("index", function(){
  var Plasma = require("organic").Plasma;
  var ShellReactor = require("../index")
  
  it("reacts to value", function(next){
    var plasma = new Plasma()

    var instance = new ShellReactor(plasma,{reactOn: "react", reactions:{
      test: function(c, next){
        expect(c.value.length).toBe(0)
        c.test = true
        next()  
      }
    }})

    plasma.emit({
      type: "react",
      value: ["test"]
    }, function(r){
      expect(r.value.length).toBe(0)
      expect(r.test).toBe(true)
      next()
    })
  })

  it("reacts to value using reactions folder", function(next){
    var plasma = new Plasma()
    
    var instance = new ShellReactor(plasma,{
      reactOn: "react", 
      reactions: __dirname+"/reactions"
    })

    plasma.emit({
      type: "react",
      value: ["test"]
    }, function(r){
      expect(r.testResult).toBe(true)
      next()
    })
  })

  it("reacts to multi-value using reactions folder", function(next){
    var plasma = new Plasma()
    
    var instance = new ShellReactor(plasma,{
      reactOn: "react", 
      reactions: __dirname+"/reactions"
    })

    plasma.emit({
      type: "react",
      value: ["test", "test2"]
    }, function(r){
      expect(r.testResult).not.toBeDefined()
      expect(r.testResult2).toBe(true)
      next()
    })
  })

  it("reacts to multi-value using reactions folder with subreactions", function(next){
    var plasma = new Plasma()
    
    var instance = new ShellReactor(plasma,{
      reactOn: "react", 
      reactions: __dirname+"/reactions"
    })

    plasma.on("subreactions", function(c, next){
      c.subReactionsResult = c.val.join("")
      next()
    })

    plasma.emit({
      type: "react",
      value: ["test", "test2", "subreactions"]
    }, function(r){
      expect(r.testResult).not.toBeDefined()
      expect(r.testResult2).toBe(true)
      expect(r.subReactionsResult).toBe("sub1")
      next()
    })
  })
})

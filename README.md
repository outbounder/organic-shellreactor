# organic-shellreactor

Continuation style passing organelle for reacting with incoming chemical as 
container for commands to be executed in chain

## DNA configuration

    {
      "reactOn": "react",
      "reactions": "path/to/folder"
    }

## reacts to chemicals `dna.reactOn`

Expected chemical structure:

    {
      value: [String]
    }

When chemical is captured the organelle does `fs.existsSync` check for 
`dna.reactions+value[0]+.js`. If such exists it is loaded and control flow is provided to the reaction.

A reaction is assumed to have the following form:

    module.exports = function(c, next){}

The `c` object is the reference to the initial chemical captured by the organelle.
The `next` method has the following signatures:

    next(wrapperCommand, commands, handler)
    next(wrapperCommand, commands)
    next(commands, handler)
    next(commands)

    next(object)
    next()

All execute the provided `commands` (array or single command string) in the local environment as child process except `next(object)` and `next()` - they return response to outer reactions.

In case `command` starts with `@`, then it is transformed to chemical and re-emitted to  plasma.

## simple example

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
      console.log(c.propertyName)
      next && next()
    })

    plasma.emit({
      type: "execute",
      value: ["reaction1"]
    }, function(r){
      console.log(r)
    })
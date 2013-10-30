# organic-shellreactor

Continuation style passing organelle for reacting with chemical forming a chain 
to be executed as local shell commands or as logic scripts

## DNA configuration

    {
      "reactOn": "react",
      "reactions": "path/to/folder" || Object { "name1": "path/to/reaction", "name2": function(c, next) }
    }

## reacts to chemicals `dna.reactOn`

Expected chemical structure:

    {
      value: [String],
      output: WritableStream, 
      error: WritableStream, 
      ...
    }

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
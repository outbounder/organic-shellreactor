# organic-shellreactor

Continuation style passing organelle for reacting with incoming chemical as 
container for commands to be executed in chain

## DNA configuration

    {
      "reactOn": "react"
    }

## reacts to chemicals `dna.reactOn`

Expected chemical structure:

    {
      commands: [String],
      value: [String],
      commandsWrapper: String
    }

When chemical is captured the organelle will start shifting `value` array in FIFO manner and re-emit the captured chemical into plasma. Any organelle which captures the reemitted chemical can modify `commands`, `value` and `commandsWrapper` properties after which can pass control back to the shellreactor by calling provided callback method.

This behaviour will repeat until `value` array is totally drained (empty). Once that happens the organelle will execute all commands buffered in `commands` array joined by ` && `. The executed commands as ChildProcess are returned as callback of the whole reaction.

## example

    var plasma = new Plasma()
    var reactor = new ShellReactor(plasma, {
      reactOn: "execute"
    })

    plasma.on("console.log value", function(c, next){
      console.log(c.value)
      next && next()
    })

    plasma.on("console.log commands", function(c, next){
      console.log(c.commands)
      next && next()
    })

    plasma.on("start npm install", function(c, next){
      c.commands.push("npm install")
      next && next()
    })

    plasma.emit({
      type: "execute",
      value: ["console.log value", "console.log commands", "start npm install"]
    }, function(childProcess){
      childProcess.stdout.pipe(process.stdout)
      childProcess.stdin.pipe(process.stdin)
    })
# Input Something then Automatically Do Anything

Input something in editor, then automatically do anything!

In Agda files, press <kbd>Enter</kbd> to automatically run <kbd>Ctrl+c Ctrl+l</kbd> is built-in.

## Features

Just add the input action in entry `"input-actions.actions"` of `settings.json`.

Or use command `"input-actions.create"` to create action according to the guidelines step by step.

### Examples

Typing <kbd>Enter</kbd> to run `"agda-mode.load"`.

```json
{
    "input": "\n",
    "command": "agda-mode.load"
},
```

When you type `hello world` anywhere, just say "hey" to you.

```json
{
  "input": "hello world",
  "command": "input-actions.encourage",
  "args": "hey"
}
```

Insert the whole word when typing `\t` in `LaTeX` files.

```json
{
  "input": "\\t",
  "command": "editor.action.insertSnippet",
  "args": {
    "snippet": "extbf{$1}",
  },
  "when":{
    "languages":["latex"]
  }
}
```

Run one more command.

```json
{
  "input": "run it",
  "command": "runCommands",
  "args": {
    "commands":[
      "Command A Id",
      {
        "command":"Command B Id",
        "args": {}
      }
    ]
  }
}
```

Regular express support.

```json5
{
  "input":{
    "regex":"\\s\\s\\s\\s", //Here to add regex
    "length":8 //length is needed
  },
  "command":"input-actions.encourage",
  "args": "Blank!"
}
```

One more input condition.

```json5
{
  "input":[
    {
      "regex":"x[xy]", //Here to add regex
      "length":2 //length is needed
    },
    "xyy",
    "xxy"
  ],
  "command":"input-actions.encourage",
  "args": "GENE!"
}
```

## Requirements

No.

## Extension Settings

- `input-actions.activate.languages`: Supported language list.
- `input-actions.actions`: Input action list, written in the format above. Using the command `"input-actions.create"` to create actions is suggested.

## Known Issues



## Release Notes


## Future 

I want to capture the input text by regex and use the captured text as the placeholder value of command argument. like this:

```json5
{
  "input":{
    "regex":"/(.+)",
    "length":10
  },
  "command":"input-actions.encourage",
  "args":"$1" //here capture the text as the argument.
}
```

It need to change the `predicate` in the code and turn it to `(matched)=>matched.push(captured)`.

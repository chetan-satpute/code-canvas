# Code Canvas

Code Canvas is an interactive algorithm visualizer. It steps through a data
structure algorithm the way a debugger would: the highlighted line, the call
stack and its variables, and the structure on the canvas all move together.

> Code is intent executing over time — Code Canvas makes that execution visible.

###### Live demo: [canvas.chetansatpute.dev](https://canvas.chetansatpute.dev)

## What it does

Pick an algorithm, shape the data it runs on, then take it one step at a time.

- **The structure is yours.** Randomize it, insert a value, remove one. The run
  happens on the data you chose rather than on a fixed example.
- **Execution is stepped, not played back.** Each click advances the generator
  one yield: the listing highlights the line that is executing, the call stack
  grows and unwinds, and each frame shows the parameters and locals in scope.
- **Structural change is animated.** Elements shift along, nodes appear, links
  are redrawn — the canvas animates the change rather than cutting to the
  result.
- **It installs and works offline.** The app is a progressive web app; a visitor
  with it already open picks up a new deployment without being told to refresh.

## The catalog

Thirteen algorithms across four structures.

| Structure          | Algorithms                                                                       | Operations you can apply                     |
| ------------------ | -------------------------------------------------------------------------------- | -------------------------------------------- |
| Array              | Linear Search, Binary Search, Merge Sort, Quick Sort, Insert Value, Remove Value | Randomize, Sort, Insert, Remove              |
| Linked List        | Insert at Head, Insert after Target, Remove                                      | Randomize, Insert Head, Insert After, Remove |
| Binary Search Tree | Insert Value, Remove Value                                                       | Randomize, Insert, Remove                    |
| Max Heap           | Push, Pop                                                                        | Randomize, Push, Pop                         |

## For students

If you found this repository while looking for project ideas, read how the
system works and then build something of your own from it. Understanding the
ideas and the design decisions behind a project is worth far more than the
code itself.

## License

Shared for learning and exploration only — you may study the ideas and the
design, but not copy, redistribute, or create derivative works from the source
without permission. See [LICENSE](LICENSE).

# The engine

The engine holds the structures on the canvas and the code that changes them.
It produces `CanvasFrame`s and nothing else reaches the renderer; how a frame
is modelled and drawn is in [canvas.md](canvas.md). Nothing in `src/engine/`
imports React.

It covers structures, the edits the structure card applies to them, and
algorithm runs: the steps a reader walks through, with the call stack and
memory beside them.

## Pieces

```
src/engine/
  elements/            CoreNode, CoreEdge, CoreLabel (see canvas.md)
  structure.ts         CoreStructure: the base every structure extends
  board.ts             CoreBoard: what is on the canvas, and pending frames
  animation.ts         tweens: move, move many, move by, appear, disappear
  operation.ts         OperationRunner and operationFor(Structure)
  algorithm.ts         AlgorithmRunner and algorithmFor(Structure)
  run.ts               CoreRun: one run's call stack, and its steps
  call.ts              CoreCall: one call's signature and memory
  step.ts              CoreStep: what the reader is shown at one point
  pointers.ts          CorePointers: node variables drawn under their node
  algorithms/
    registry.ts        algorithm id → AlgorithmRunner
    array-linear-search.ts
    linked-list-insert-head.ts
    binary-search-tree-insert.ts
  structures/
    registry.ts        StructureId → { create, operations }
    array/
      structure.ts     CoreArray, with its cursors
      operations.ts    randomize, sort, insert, remove
      algorithm.ts     defineArrayAlgorithm
    linked-list/
      structure.ts     CoreLinkedList and its nodes, head and pointers
      operations.ts    randomize, insert at head, insert after, remove
      algorithm.ts     defineLinkedListAlgorithm
    binary-search-tree/
      structure.ts     CoreBinarySearchTree and its nodes, root and pointers
      operations.ts    randomize, insert, remove
      algorithm.ts     defineBinarySearchTreeAlgorithm
  testing/
    trace.ts           traceRun: plays a run to the end for a test
```

## Structures

A `CoreStructure<Data>` owns its nodes and lays them out from its own `x/y`,
which is the top-left of its first node. It starts one cell in
(`NODE_WIDTH`, `NODE_HEIGHT`), so the name to its left and the labels above
its first node keep the frame's coordinates at 0 or more.

Every structure provides:

- `toData()` and `restore(data)`: conversion to and from its plain form
  (`number[]` for all three: an array in order, a linked list head first, and
  a binary search tree in preorder).
  `restore` replaces the contents in place, so the board keeps pointing at
  the same object.
- `rearrange()`: recomputes every position it owns from its own.
- `serializeContents(frame)`: writes its nodes and edges into a frame.

The base class owns the structure's **name**, the variable the listings call
it by (`array`). Only the text is stored. `serialize` writes it one cell to
the left of `x/y`, at the structure's opacity, after the contents. This is the
same rule a node's own labels follow: position is derived when serializing,
never stored, so nothing can leave it behind.

## The board and its frames

`CoreBoard` holds the structures on the canvas and the frames drawn since the
reader was last shown anything.

- `pushFrame()` serializes the whole board into a frame and queues it.
- `drainFrames()` hands over the queued frames and empties the queue. If
  nothing was pushed, it returns one frame of the board as it stands. That
  way a change with no animation, such as an instant reorder, is still shown.

The explore page's `useExploreSession` (`src/features/explore/hooks/`) keeps
the board, its structure, that structure's operations and the run in progress
together as one session. Each operation puts the drained frames into the session, which for
an operation is the single frame `drainFrames` stands in, and `CanvasCard`
draws it. Moving to another algorithm of the same structure keeps the
session, so what the user built stays. The route component is reused across
algorithms, so it isn't remounted when the structure changes; instead the
session is replaced during render, before the old structure can be drawn or
edited.

## Writing a tween

Structure operations are instant, and Linear Search only recolors. The
tweens are for algorithm runs that move values, where the movement is what
the reader watches; Insert at Head is the first to use them. A tween is
written as "mutate a little, push a frame", repeated. The helpers in
`animation.ts` do this for movement and opacity:

- `animateMoveMany(board, moves)` moves a group together and pushes one frame
  per tick for the whole group. All of them move at the speed of the longest
  move, so they stay in formation. The speed is one pixel per frame until a
  move would take more than 60 frames, after which the speed rises so it
  lands in 60. A move goes one axis at a time, so a diagonal reads as two
  legs.
- `animateMove` and `animateMoveBy` are shorthands over it.
- `appear` and `disappear` fade in steps of 0.1, ten frames end to end. Each
  step is rounded to a tenth: adding 0.1 ten times gives 0.9999999999999999,
  which would cost an eleventh, invisible frame.

A moved element needs only `x` and `y`. A node derives its labels when it
serializes, so it has nothing to recompute. A structure lays out what it owns
from its position, so the helpers call its `rearrange()` after each tick.

## Operations

An operation is an edit from the structure card. It is neither stepped nor
animated: it mutates the structure and returns, and the next frame drawn shows
the result.

`operationFor('array', CoreArray)` binds a structure class once. Each
operation defined through it receives a `CoreArray` with no cast, because the
runner's `instanceof` check narrows the type. The id names the structure in
errors, since class names do not survive minification. An operation has two
parts:

- `args`: the names it reads, such as `['index', 'value']`. They must match
  the operation's argument names in the catalog; a name the catalog doesn't
  supply throws.
- `apply(structure, args)`: makes the edit, with each argument already a
  number.

An operation never parses text. The catalog declares each argument's `kind`,
and that is the only place it is declared: the structure card checks the
fields against it with `invalidArguments`, and the hook parses them with
`parseArguments`, both from `#utils/argument.ts`. A field is accepted only in
plain decimal notation (no `0x2A` or `1e300`), and only if the number as drawn
is at most five characters, which is what fits inside a node. A rejected field
is marked and keeps its text, and fields are cleared only once an edit is
made.

Whether an index is in range is not a parse error: only the engine knows the
current length, so the array clamps it.

`structures/registry.ts` maps each `StructureId` to a `create()` for a random
starting structure and its operations, keyed by the catalog's operation ids.
The map is typed by `StructureId`, so a structure the catalog lists without
an engine is a type error.

## The array

Cells sit flush against each other, one `NODE_WIDTH` apart, because an
array's elements are contiguous. `rearrange()` rewrites each cell's top label
to its index: an index belongs to the position, not to the value.

Every operation is instant:

- **Randomize** replaces the contents with 5–10 random values.
- **Sort** reorders the cells ascending.
- **Insert** puts a new cell at the index, and the cells after it shift one
  place along.
- **Remove** takes the cell at the index out, and the cells after it close the
  gap.

The index for Insert is clamped to `[0, length]`, and for Remove to
`[0, length − 1]`. Removing from an empty array does nothing.

## The linked list

A `CoreLinkedListNode` is a `CoreNode` with a `next` link. The link is the
`CoreEdge` itself, not a reference to the successor, and `setNext(node)`
makes a new edge each time, since an edge is drawn from the node it starts
at. A node writes its own link when it serializes, so a walk that visits
every node writes every link exactly once.

`CoreLinkedList` holds only `head`. `nodes()` follows `next` from it, which
is the only way to reach a node, and `rearrange()` places the nodes it
reaches two cells apart (`LINK_SPACING`): the gap is where the link is drawn.
The list is named `list`, and it has no indices.

Two kinds of label are derived from the node they name when the list
serializes, so they follow it through a move or a fade:

- `head` is drawn above the head node.
- **Pointers** are the listing's node variables:
  `list.setPointer('node', node)` and `list.clearPointer('node')`. Each is
  drawn under the node it holds, and pointers on one node share a label.
  `restore` clears them. The list keeps them in a `CorePointers`
  (`pointers.ts`), which the binary search tree shares.

A node held by a pointer is drawn even if the list cannot reach it. That way
a node an algorithm has created but not yet linked in is on the canvas,
because the code can reach it. `rearrange()` leaves such a node where the
algorithm put it.

Every operation is instant:

- **Randomize** replaces the contents with 4–6 distinct random values. A node
  draws two cells from the next, so six already take 720px.
- **Insert at head** links a new node in front of the head.
- **Insert after** links a new node behind the first node holding the target.
- **Remove** unlinks the first node holding the target.

Insert after and Remove name their node by value, which is why random values
are distinct. A value typed in can repeat, and the first match from the head
is the one used. A target the list does not hold changes nothing.

## The binary search tree

A `CoreBinarySearchTreeNode` is a `CoreNode` with a `left` and a `right`
link, each a `CoreEdge` like the list's `next`. `child(side)` reads one and
`setChild(side, node)` makes a new edge for it. The tree holds only `root`,
is named `tree`, and holds no duplicates: `insert(value)` links a new node
into the one place the ordering leaves for it, does nothing for a value it
already has, and leaves the layout to `rearrange()`.

Its plain form is its values in preorder, a parent before its children.
`restore` inserts them in the order given, and inserting a preorder rebuilds
the same shape, so a tree round-trips through `toData` exactly. A random
order gives whatever shape that insertion order makes, which is how
Randomize builds an unbalanced tree.

`rearrange()` gives each node the next column in order (`inorder()`), one
`NODE_WIDTH` apart, and puts it on the row for its depth, levels two rows
apart (`LEVEL_SPACING`). That draws no crossing links without measuring a
subtree. Two nodes on one level always have an ancestor between them in
order, so the cells beside a node are empty, and the row under it holds only
its own links and its pointer. `root` is drawn above the root node, derived
from it the way the list's `head` is. Pointers work as the list's do: a node
a pointer holds is drawn even when the tree cannot reach it, and
`rearrange()` leaves such a node where the algorithm put it.

Every operation is instant:

- **Randomize** replaces the contents with 5–7 distinct random values, in
  random order. Every node has its own column, so seven draw 480px wide.
- **Insert** inserts the value. One the tree already holds changes nothing.
- **Remove** unlinks a leaf, lifts a lone child into the node's place, or,
  for a node with two children, copies its in-order successor's value up and
  removes the successor's node instead. A value the tree does not hold
  changes nothing.

## Runs

A run steps an algorithm against its listing. The listing's line markers
(see [code-highlighting.md](code-highlighting.md)) name the lines a step can
stand on, and the algorithm is a generator that mutates the board and yields
a `CoreStep` at each of them:

- `line`: the listing line, 1-based like the code card's gutter.
- `frames`: everything the board pushed since the last step, so a step is
  a film strip just like an operation's frames.
- `callStack`: one `CallStackEntry` per call in progress, innermost first.

Nothing is computed ahead of time. Each Next step runs the generator to its
next yield.

### The run, its calls and memory

`algorithmFor('array', CoreArray)` binds a structure class the way
`operationFor` does: an `instanceof` check narrows the type, and a check
fails if one of the `args` names is missing. `play` receives
`{ run, board, structure, args }`, with the arguments already parsed by the
kinds the catalog declares.

`CoreRun` holds one run: the listing's anchors and the call stack.

- `run.step(anchor)` drains the board and builds the step. It throws on an
  anchor the listing doesn't define. Otherwise a mismatch between algorithm
  and listing would show up as a highlight on a plausible-looking wrong line.
- `run.call(name, parameters)` pushes a `CoreCall`.

The call stack lives on the run, not on the board. A run that ends or is
abandoned is just dropped, and the board has nothing left to clear.

A parameter's value is a number, an array or `STRUCTURE`, for a structure
with no literal to print, such as a linked list. The signature names that
kind of parameter bare (`insertHead(list, value: 42)`), as
[code-highlighting.md](code-highlighting.md) expects.

A `CoreCall` keeps parameters in declaration order, then locals in the order
they were first set. `set(name, value)` declares a local or updates any
variable in place. `clear(name)` drops a local that has gone out of scope.
Parameters are never dropped. A call serializes into two views:

- The **signature**, built from the parameters, with arrays printed whole:
  `linearSearch(array: [3, 5, 1], target: 42)`.
- **Memory**, which holds the scalar variables only. An array or a structure
  is already on the canvas, so memory does not repeat it. The memory
  card shows the innermost call, which is the one running.

### The last step is returned

`play` returns `Generator<CoreStep, CoreStep>`. Every step but the last is
yielded, and the last, at the closing brace (`exit`), is the generator's
return value. That way the page knows it is showing the last step as soon as
it shows it, without running the algorithm one step ahead. On that step,
Next step becomes Finish.

### Stop and Finish

Starting a run calls `board.snapshot()`, which captures which structures are
on the board, each one's `toData()` and its position, opacity and name, and
returns the undo. Stop on a run
that has not finished calls it, so an abandoned run leaves nothing behind.
Finish keeps what the run did. Linear Search changes no values, so the two
look the same there, but an insert would not.

The arguments form empties when a run starts. Moving to another algorithm
during a run ends it the way Stop does: undone midway, kept once finished. A
run whose generator throws is logged and undone.

### Array cursors

An index variable from the listing is drawn under the cell it indexes:
`array.setCursor('i', i)` and `array.clearCursor('i')`. A cursor is stored
as an index, not on a node, because an index can point past the last cell:
the loop check that ends a linear search has `i === array.length`, and its
cursor sits under the empty cell after the array. Cursors on the same cell
share one label (`i j`). The label's position comes from the index when the
array serializes, and `restore` clears every cursor.

### Linear Search

| Step      | Canvas                                                | Memory    |
| --------- | ----------------------------------------------------- | --------- |
| `enter`   | unchanged                                             | target    |
| `loop`    | cursor `i` under cell i, past the end when i = length | target, i |
| `compare` | cell i `secondary`                                    | target, i |
| `found`   | cell i `success`                                      | target, i |
| `missing` | cursor gone, every cell `danger`                      | target    |
| `exit`    | colors reset                                          | target    |

A failed comparison sets the cell back to `primary` and steps to `loop` with
the next `i`. That includes the final check, with `i` past the end, which is
what ends the loop.

### Insert at Head

| Step      | Canvas                                                                          | Memory |
| --------- | ------------------------------------------------------------------------------- | ------ |
| `enter`   | unchanged                                                                       | value  |
| `create`  | the new node fades in, `secondary`, one row below the head, with pointer `node` | value  |
| `link`    | its link to the head fades in; none on an empty list                            | value  |
| `setHead` | the list slides one place along, then `head` moves to the node as it rises in   | value  |
| `exit`    | color reset, `node` gone                                                        | value  |

`list.head = node` only reassigns a pointer. The canvas lays the list out in
order, though, so the node joins the row as the reader watches. The slide
comes first and the rise second. Done at once, the rising node would pass
through the old head while it is still leaving the slot. The link stretches
through the slide because both of its nodes hold it. When the step ends, every
node is where `rearrange()` would put it.

### Insert Value

| Step                                      | Canvas                                                                 | Memory |
| ----------------------------------------- | ---------------------------------------------------------------------- | ------ |
| `enter`                                   | unchanged                                                              | value  |
| `emptyCheck`                              | unchanged                                                              | value  |
| `setRoot`                                 | on an empty tree, the node fades in as the root, `success`             | value  |
| `start`                                   | pointer `node` under the root                                          | value  |
| `equalCheck`                              | `node` `secondary`                                                     | value  |
| `duplicate`                               | `node` `danger`                                                        | value  |
| `lessCheck`                               | unchanged                                                              | value  |
| `leftCheck`, `rightCheck`                 | unchanged                                                              | value  |
| `setLeft`, `setRight`                     | the tree opens a column, then the node and its link fade in, `success` | value  |
| `goLeft`, `goRight`                       | `node` back to `primary`, and the pointer moves to the child           | value  |
| `rootReturn`, `leftReturn`, `rightReturn` | unchanged                                                              | value  |
| `exit`                                    | colors reset, `node` gone                                              | value  |

`while (true)` is not a step: it tests nothing, so `goLeft` leads straight to
the next `equalCheck`. The pointer is put down a step before the node is
colored, as Linear Search's cursor is.

`node.left = new TreeNode(value)` creates and links the node in one
statement, so unlike Insert at Head nothing is staged off the structure. The
new node needs a column of its own, so before it appears, every node after
the value in order slides one column right. When the new node goes on the
left that includes `node` itself, and its pointer moves with it. Only then do
the node and its link fade in, into the opened slot. When the step ends,
every node is where `rearrange()` would put it.

The descent pointer is `node` rather than `current` because of where it is
drawn. A link to a child in the next column leaves the node at 45°, and where
it crosses the top of the label's text it is about 25px to the side of the
label's center. A seven-letter name reaches about 28px either side, so the
link clips it; a four-letter name reaches about 16px and clears it.

### Adding an algorithm

1. Write the listing in `src/catalog/listings/<id>.md`, with a marker on
   every line a step stands on, and add the algorithm to
   `src/catalog/algorithms.ts`.
2. Write the generator in `src/engine/algorithms/<id>.ts` with the
   structure's binder, for example `defineArrayAlgorithm`.
3. Register it in `src/engine/algorithms/registry.ts`. The explore route
   treats an algorithm that has no runner, or no listing, as one it cannot
   show.
4. Test it in `src/engine/algorithms/<id>.test.ts` against the real listing,
   with `traceRun` from `src/engine/testing/trace.ts`, so a step naming a
   line the listing lacks fails `pnpm test` rather than the explore page.

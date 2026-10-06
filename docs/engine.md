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
  cursors.ts           CoreCursors: index variables drawn under their cell
  algorithms/
    registry.ts        algorithm id → AlgorithmRunner
    array-linear-search.ts
    array-merge-sort.ts
    linked-list-insert-head.ts
    binary-search-tree-insert.ts
    binary-search-tree-remove.ts
    max-heap-push.ts
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
    max-heap/
      structure.ts     CoreMaxHeap: its array row, its tree and cursors
      operations.ts    randomize, push, pop
      swap.ts          animateSwap: two values trading slots
      algorithm.ts     defineMaxHeapAlgorithm
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
  (`number[]` for all four: an array in order, a linked list head first, a
  binary search tree in preorder, and a max heap as the array it is kept in).
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
- `float(node)` and `unfloat(node)` hold a value in flight that belongs to no
  structure, which the frame draws over everything (see
  [canvas.md](canvas.md)). An algorithm floats a node and unfloats it within
  one step, so no step shows one, and the snapshot's undo drops any a
  throwing run left behind.

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
`rearrange()` leaves such a node where the algorithm put it. `layout()` works
out where `rearrange()` would put each node without moving any, which is what
an algorithm animates towards.

Pointers on one node are stacked rather than joined: the first under the node
as usual, each later one half a row (`STACK_LINE`) lower, in the order they
arrived. Joined, `node parent` is long enough that a link to a child in the
next column runs through it. A later line sits further down, where that link
is further out, and spills into the next level only in the node's own column,
which no other node takes. Putting a name a full row lower, or in the empty
cell beside the node, was tried and read as naming the neighbouring node on
that level. The listings so far put a short name (`node`, `min`) first
whenever two meet, so the first line clears the link too.

Every operation is instant:

- **Randomize** replaces the contents with 5–7 distinct random values, in
  random order. Every node has its own column, so seven draw 480px wide.
- **Insert** inserts the value. One the tree already holds changes nothing.
- **Remove** unlinks a leaf, lifts a lone child into the node's place, or,
  for a node with two children, copies its in-order successor's value up and
  removes the successor's node instead. A value the tree does not hold
  changes nothing.

## The max heap

`CoreMaxHeap` is an array kept in heap order, named `heap`, and drawn twice:
the array the listings index, and below it the complete binary tree that
array represents, where the children of slot `i` are slots `2i + 1` and
`2i + 2`. Slot `i` is `cells[i]` in the row and `nodes[i]` in the tree, and
`links[i]` is the edge into `nodes[i]` from its parent's node (none into the
root). Its plain form is the array itself, so `restore` takes the values in
the order given and assumes they are already in heap order.

The row is laid out as the array's is, cells flush, one `NODE_WIDTH` apart.
The tree uses the binary search tree's layout (`treeLayout()`): each node the
next column in order, levels two rows apart. Its root is `TREE_OFFSET`, four
rows, under the row: the two rows under the array are the lanes a swap moves
its cells in, the first also holding the cursors, and one more keeps the far
lane off the root.

A slot's index above it and its cursors under it belong to the slot, not to
the value in it. They are derived from the slot when the heap serializes, at
its cell's opacity, and left out while the cell is away from its slot, since
a cell leaving the slot passes through the rows they are drawn in. Cursors
(`heap.setCursor('index', i)`) are kept in a `CoreCursors` (`cursors.ts`),
which the array shares, and are drawn under the row only: an index names an
array slot, and the row under a tree node is where its links leave, which a
label as long as `parent` would clip.

`setVariant(i, variant)` colors a slot in both views at once, so the two
cannot tell different stories. `swap(a, b)` exchanges the two cells between
slots, while the tree's two nodes stay where they stand and trade their
values and variants. A tree node is held in place by its links, and moving it
drags them out of shape, which reads as the tree coming apart rather than as
two values swapping.

Every operation is instant:

- **Randomize** replaces the contents with 5–7 random values, put in heap
  order by sifting each parent down, deepest first. Every tree node has its
  own column, so seven draw 480px wide. Values may repeat: no operation names
  a slot by its value.
- **Push** appends the value and sifts it up past every smaller parent.
- **Pop** moves the last value into the root and sifts it down past its
  larger child. Popping an empty heap does nothing.

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
- `run.call(name, parameters)` pushes a `CoreCall`, and `run.return(anchor)`
  builds the innermost call's closing-brace step and then pops it, so that
  step still shows the call being left.

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
array serializes, and `restore` clears every cursor. The array and the max
heap keep them in a `CoreCursors` (`cursors.ts`), and each says where a cell
is drawn when it serializes.

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

### Remove Value

| Step                             | Canvas                                                                                | Memory |
| -------------------------------- | ------------------------------------------------------------------------------------- | ------ |
| `enter`                          | unchanged                                                                             | value  |
| `start`                          | pointer `node` under the root; none on an empty tree                                  | value  |
| `noParent`                       | unchanged                                                                             | value  |
| `search`                         | `node` `secondary`                                                                    | value  |
| `setParent`                      | pointer `parent` joins `node`                                                         | value  |
| `lessCheck`                      | unchanged                                                                             | value  |
| `goLeft`, `goRight`              | `node` back to `primary`, and the pointer moves to the child, or goes at `null`       | value  |
| `missingCheck`, `twoCheck`       | unchanged                                                                             | value  |
| `missing`                        | unchanged                                                                             | value  |
| `minParent`                      | `parent` joins `node`                                                                 | value  |
| `minStart`                       | pointer `min` under the right child, `tertiary`                                       | value  |
| `minLoop`                        | unchanged                                                                             | value  |
| `minSetParent`                   | `parent` joins `min`                                                                  | value  |
| `minGoLeft`                      | the old `min` back to `primary`, the pointer and the color move to its left child     | value  |
| `copy`                           | a copy of `min`'s value rises and slides into `node`, which takes it, `success`       | value  |
| `retarget`                       | `node` joins `min`                                                                    | value  |
| `child`                          | `min` gone, `node` `danger`, pointer `child` under the child if there is one          | value  |
| `rootCheck`, `sideCheck`         | unchanged                                                                             | value  |
| `setRoot`, `setLeft`, `setRight` | the node fades out with its links, the new link fades in, and the tree closes the gap | value  |
| `rootReturn`                     | unchanged                                                                             | value  |
| `exit`                           | colors reset, pointers gone                                                           | value  |

A pointer holding `null` is nowhere on the canvas, so `parent` appears only
at its first assignment and `node` goes when the search walks off a leaf.
`min` is declared in the two-children block and leaves the canvas at `child`,
the first step past its brace.

`node.value = min.value` copies a value, as Merge Sort's assignments do, so
what travels is a floating copy, and `min` keeps its value until its node
leaves: for that one step the tree holds the value twice, which is what the
code has done. `min` is the successor, the next column along, so the copy
rises up that column, which no other node takes, then slides into `node` from
the empty cell beside it.

`parent.left = child` unlinks the node, but the run still holds it in `node`
until it returns, and the canvas shows what the code can reach. The node fades
out at the assignment all the same. The child's subtree rises into its place,
so a node left standing there would sit on top of the child or have the new
link drawn through it, and it would show for one step at most before the
return. The node and every link touching it fade first, while they are still
drawn where they were. Then the new link fades in, and the tree moves to its
`layout()`: the child's subtree rises one level and the nodes after the
removed one in order move back a column. When the step ends, every node is
where `rearrange()` would put it.

### Push

| Step      | Canvas                                                                                  | Memory               |
| --------- | --------------------------------------------------------------------------------------- | -------------------- |
| `enter`   | unchanged                                                                               | value                |
| `append`  | the tree opens a column, then the new cell, node and link fade in, `secondary`          | value                |
| `start`   | cursor `index` under the new cell                                                       | value, index         |
| `loop`    | `parent` gone after a climb; at the root, the value `success`                           | value, index         |
| `parent`  | cursor `parent` under the parent's cell                                                 | value, index, parent |
| `compare` | the parent `tertiary`                                                                   | value, index, parent |
| `stop`    | the value `success`, the parent back to `primary`                                       | value, index, parent |
| `swap`    | the two cells pass under the row into each other's slots; the tree's nodes trade values | value, index, parent |
| `climb`   | the lower slot back to `primary`, `index` moves up to share the label with `parent`     | value, index, parent |
| `exit`    | colors reset, cursors gone                                                              | value                |

The listing takes the heap as `number[]`, but the signature names it bare
(`push(heap, value: 42)`): the array changes as the run goes, so a copy
printed at the call would be stale by the first swap, and the canvas shows it
as it stands. `parent` is declared in the loop body, so it leaves memory and
the canvas before the condition is tested again.
A value that reaches the root is marked `success` on the `loop` step that
finds `index` at 0, the same outcome `stop` marks for a value a parent
holds back.

`heap.push(value)` makes a new last slot, which is a leaf of the tree. As in
the binary search tree's Insert Value, every tree node has a column of its
own, so before anything appears the tree slides to the layout it will have
with the leaf, which moves the nodes after the leaf in order one column
along. The cell, the node and its link then fade in together. The pushed
value is `secondary` from there on, and its colors travel with it through
every swap, so the reader can follow it up the heap.

A swap (`animateSwap` in `swap.ts`) moves the two cells out of the row, along
and back in, since along the row each would pass through every cell between.
They go under it, one lane each, because the row above holds every slot's
index and a label is drawn over a node; the climbing value takes the near
lane. Only once the cells have landed do the tree's two nodes trade their
values, in place, in one frame. When the step ends, every cell and node is
where `rearrange()` would put it.

### Merge Sort

Merge Sort takes no arguments. Each call of `mergeSort` is its own generator,
and a call recurses with `yield*`, so one step is still one `next()` however
deep the run is. A call's closing-brace step (`exit`, `mergeExit`) is its
return value rather than a yield: the outermost one is the run's last step,
and a caller yields the step it gets back. The call is popped right after that
step is built.

| Step                                          | Canvas                                                                          | Memory  |
| --------------------------------------------- | ------------------------------------------------------------------------------- | ------- |
| `enter`                                       | the array this call sorts is named `array`                                      | —       |
| `base`                                        | unchanged                                                                       | —       |
| `sorted`                                      | an array of one `success`                                                       | —       |
| `mid`                                         | cursor `mid` under its cell                                                     | mid     |
| `left`, `right`                               | the half fades in under the cells it was copied from, named `left` or `right`   | mid     |
| `sortLeft`, `sortRight`                       | before the call, and again once it returns                                      | mid     |
| `merge`                                       | before the call, and again once it returns with the array `success`             | mid     |
| `mergeEnter`                                  | `mid` gone                                                                      | —       |
| `startLeft`, `startRight`, `startArray`       | cursor `i` under `left`, `j` under `right`, `k` under `array`                   | i, j, k |
| `loop`, `drainLeft`, `drainRight`             | unchanged; the check that ends the loop, with an index past its half, is a step | i, j, k |
| `compare`                                     | `left[i]` and `right[j]` `secondary`                                            | i, j, k |
| `takeLeft`, `takeRight`, `drainLeftTake`, …   | a copy travels from the half into `array[k]`, which takes the value, `success`  | i, j, k |
| `nextLeft`, `nextRight`, `drainLeftNext`, …   | the value read back to `primary`, its cursor one along                          | i, j, k |
| `nextSlot`, `drainLeftSlot`, `drainRightSlot` | `k` one along                                                                   | i, j, k |
| `mergeExit`                                   | `i`, `j` and `k` gone                                                           | —       |
| `exit`                                        | colors reset, `mid` gone, the halves fade out and leave the board               | —       |

`array[k] = left[i]` is an assignment. It copies a value into a cell that
already exists: `left` and `right` are read and never change, and `array`
keeps every cell it had. So what travels is a copy that belongs to neither
array, held by `board.float`, and the cell it lands on takes the value where
it stands. The copy rises out of the half, goes along the row under `array`
and up into the cell; going straight there, it would cross the cells in
between. Moving the halves' own nodes up into `array` would sort just as
well, but it would show the reader a different algorithm from the listing.

`array.slice` makes a new array of copies, so each half fades in two rows
under the cells it was copied from (`HALF_OFFSET`, three rows: `array`'s
cursors and the copies' lane, then the half's indices). The right half starts
one cell further along, which leaves room for its name between the two. The
halves go out of scope with the call's return, which is when they fade out
and leave the board.

The canvas names only what the running call can reach, the way memory shows
only its variables. Every call calls the array it sorts `array`, so while a
deeper call runs, its caller's names and `mid` come off, and they go back on
when it returns. `merge` has no `mid`, so it comes off for that call too.

Signatures print the arrays whole. `merge` writes into an array that both it
and its caller take as `array`, so each write updates both signatures and
neither shows a value the array no longer holds.

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

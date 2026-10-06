# The engine

The engine holds the structures on the canvas and the code that changes them.
It produces `CanvasFrame`s and nothing else reaches the renderer; how a frame
is modelled and drawn is in [canvas.md](canvas.md). Nothing in `src/engine/`
imports React.

So far the engine covers structures and the edits the structure card applies
to them. Algorithm runs (steps, the call stack, memory) are not built yet.

## Pieces

```
src/engine/
  elements/            CoreNode, CoreEdge, CoreLabel (see canvas.md)
  structure.ts         CoreStructure: the base every structure extends
  board.ts             CoreBoard: what is on the canvas, and pending frames
  animation.ts         tweens: move, move many, move by, appear, disappear
  operation.ts         OperationRunner and operationFor(Structure)
  structures/
    registry.ts        StructureId → { create, operations }
    array/
      structure.ts     CoreArray
      operations.ts    randomize, sort, insert, remove
```

## Structures

A `CoreStructure<Data>` owns its nodes and lays them out from its own `x/y`,
which is the top-left of its first node. It starts one cell in
(`NODE_WIDTH`, `NODE_HEIGHT`), so the name to its left and the labels above
its first node keep the frame's coordinates at 0 or more.

Every structure provides:

- `toData()` and `restore(data)`: conversion to and from its plain form
  (`number[]` for an array). `restore` replaces the contents in place, so the
  board keeps pointing at the same object.
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

The explore page's `useStructureBoard` (`src/features/explore/hooks/`) keeps
the board, its structure and that structure's operations together as one
session. Each operation puts the drained frames into the session, which for
an operation is the single frame `drainFrames` stands in, and `CanvasCard`
draws it. Moving to another algorithm of the same structure keeps the
session, so what the user built stays. The route component is reused across
algorithms, so it isn't remounted when the structure changes; instead the
session is replaced during render, before the old structure can be drawn or
edited.

## Writing a tween

Nothing uses these yet: structure operations are instant, and the tweens are
there for algorithm runs, where movement is what the reader watches. A tween
is written as "mutate a little, push a frame", repeated. The helpers in
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

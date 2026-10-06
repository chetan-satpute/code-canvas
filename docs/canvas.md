# The canvas

The canvas card draws a structure as nodes, the edges between them and the
labels that annotate them. That picture is produced in two layers, which
mirror each other on purpose.

## Two layers

```
mutable elements              plain frame                  React
src/engine/elements/   ──▶    src/canvas/frame.ts   ──▶    CanvasCard
CoreNode, CoreEdge,           CanvasFrame {                  useCanvasFrames
CoreLabel                       nodes, edges, labels         (one frame per
  .serialize(frame)           }                               animation frame)
```

- **`src/engine/elements/`** holds the objects an algorithm changes:
  `CoreNode`, `CoreEdge` and `CoreLabel`. Each has a `serialize(frame)` that
  pushes plain data describing it as it stands right now into a
  `CanvasFrame`. Nothing here imports React.
- **`src/canvas/`** holds that plain data (`CanvasNode`, `CanvasEdge`,
  `CanvasLabel`, `CanvasFrame`), the functions that draw it, and the node size
  every layout is measured in. Nothing here imports the engine or React.

The field names repeat between `CoreNode` and `CanvasNode`. That repetition is
the boundary doing its job: the engine side is what an algorithm writes, and
the plain side is the only thing that reaches the renderer. A frame holds
only numbers and strings, so it can be kept, compared or sent anywhere.

## Coordinates

A frame's coordinates are CSS pixels. They start at 0 and never go negative.
A node is a 60 × 30 cell (`NODE_WIDTH`, `NODE_HEIGHT` in
`src/canvas/elements/node.ts`), and layouts are written in multiples of it.

Position is held in one place, and everything else is derived from it:

- `CoreNode.x/y` are the coordinates anyone writes, and they are the node's
  top-left corner.
- `CoreEdge` holds its two nodes rather than coordinates, and reads their
  positions when it serializes. Move a node and its edges follow; create an
  edge mid-animation and it is drawn correctly from its first frame. The
  drawing works out the node centers, pulls both ends back to the node
  borders plus a small gap, and puts an arrowhead at the end node.
- A node's own labels, such as the index above an array cell or a pointer
  name below it, are stored on the node as text only:
  `labels: { top?, right?, bottom?, left? }`. Their position and opacity
  are taken from the node when it serializes, so a label can never be left
  behind by a move or a fade.
- `CoreLabel` is for free-standing text, such as a structure's name, and is
  positioned by whatever owns it.

A label occupies a node-sized cell and centers its text in it, so a label
placed beside a node lines up with that node's column or row without anyone
measuring text.

A frame is drawn edges first, then nodes, then labels. An edge never reaches
its own nodes, since both ends stop at the gap, so the order is not what
keeps it off them. It matters for a node passing over an edge it is not part
of, such as a value in flight crossing a tree, which should cover the line;
labels go last so an annotation is never hidden.

## Colors and font

The canvas has no colors of its own. `src/index.css` defines `--canvas-*`
tokens beside the other semantic tokens: one fill per node variant, the node
text, the node's rim and sheen, the edge and the label. `src/canvas/theme.ts`
reads them and `--font-code` from `:root` once, with `getComputedStyle`,
because a canvas cannot resolve `var()`. A token that is missing throws an
error naming it, instead of silently drawing in whatever color was set last.

An algorithm says what it is doing to a value by setting the node's
`variant`, not a color: `primary` is the resting state, `secondary` and
`tertiary` mark what is being looked at, and `success` and `danger` mark an
outcome. Each variant's fill is the step of its family that keeps the node
text above 4.5:1. That is why `success` is `--teal-700` rather than a lighter
teal.

## A step is a film strip

A step carries `CanvasFrame[]`, not one frame. A step that only changes a
color carries one frame; a step that moves something carries one full frame
per tick of the movement. `useCanvasFrames`
(`src/hooks/`) plays them one per `requestAnimationFrame`
and holds the last until the next step replaces the array. Playback is keyed
on the array's identity, so re-rendering the same step does not replay it.

While a step plays, the canvas element keeps the largest size any of its
frames needs, so a structure that grows mid-animation does not make the
element jitter against its container. The last frame settles the element to
its own size, so a step that shrank the structure leaves no slack behind.

`renderCanvasFrame` assigns the canvas's `width` and `height` on every frame,
scaled by `devicePixelRatio` so drawing stays sharp. That assignment also
clears the canvas. It then pads the drawing by a fixed 12 px margin on every
side.

Canvas text is rasterized once and never reflows, and nothing redraws the
canvas between steps. A frame drawn before the web font arrives — typically
the first one, on a cold load — keeps the fallback face until the next step
replaces it.

## Size and overflow

The canvas is always drawn at 1:1 and never scaled to its card. Inside
`CanvasCard` it sits at the top-left of a scrolling container, so anything
wider or taller than the card is reached by scrolling.

It is pinned top-left rather than centered because its size changes whenever
the structure does — between steps, and on the last frame of a step, when the
element settles from the largest size the step needed to its own. A centered
canvas would move by half of every such change, so an insert at the end of an
array would shift every cell, including the ones the code never touched.
Pinned, a size change only adds or removes space on the right and bottom, and
nothing already drawn moves unless the frames move it.

On a 360 px phone with overlay scrollbars the card is 326 px wide, which fits
five cells plus the margin (324 px): an array of four with its name. Anything
wider scrolls inside the card.

## Left for the engine

These were found in v2's code and belong with the engine rather than with
the elements. The engine's structures and operations exist now (see
[engine.md](engine.md)); these wait for the parts that need them:

- **Marking a node.** v2's algorithms wrote the same pair of helpers four
  times: set a node's variant and put a variable's name under it, then put
  both back. The name half is now the cursors the array and the max heap
  share and the pointers the linked list and the binary search tree share
  (see [engine.md](engine.md)), which both join names that land on one node
  (`'i j'`). Algorithms set the variant directly. A single
  `mark(name, variant)` / `unmark()` has not paid off yet: Linear Search, the
  tree's Insert Value and the heap's Push all name a node a step before they
  color it, so the two halves do not move together.
- **An edge's opacity could follow its nodes.** A node's labels take its
  opacity, but an edge keeps its own, so a node fading out leaves a
  full-strength arrow pointing at it; v2 faded such edges by hand. Serializing
  an edge at the lowest of its own opacity and its two nodes' would apply the
  same derive-from-the-node rule labels follow, while still letting an edge
  appear or disappear between nodes that stay.
- **Keyframes were considered and declined for now.** Interpolating between a
  few poses at draw time would shrink a step from one full frame per pixel of
  movement to a handful. It would need stable element ids. The film strip was
  kept because algorithms author motion simply, as "mutate a little, push a
  frame".

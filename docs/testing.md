# Testing

The plan for testing the v2 application, written before any test exists. It
covers why this codebase can be tested almost entirely without a browser, the
phases the suite is built in, and what each phase is responsible for.

Written against the tree at `89d7b88`.

## Why unit tests are enough here

The question worth answering is "does the visualization correctly depict what
the code says". In most visual applications that can only be answered by
looking at pixels, which is why visual products tend to grow slow, flaky
screenshot suites.

That is not the case here, and it is the most important fact about testing
this codebase.

The engine has no React import and hands the renderer nothing but plain data.
A run is a generator of `CoreStep`:

```
CoreStep {
  activeLine: number          // which line of the listing is highlighted
  frames: CanvasFrame[]       // the film strip, as arrays of numbers and strings
  callStack: CallStackFrame[] // signatures and scalar variables
}
```

`CanvasFrame` is `{ nodes, edges, labels, width, height }`, where a node is
`{ x, y, value, variant, opacity }`. There is not a class instance or a
function anywhere in it.

So the highlighted line, the animation, the call stack and the variables in
scope are all assertable as data in plain Node — no browser, no canvas, no
screenshots. The usual testing pyramid inverts: nearly all the value sits in
fast unit tests.

### The gap this leaves

One, and it is named here so it is not mistaken for coverage. `jsdom` has no
layout engine: every element measures 0×0 and Tailwind classes are inert
strings. Horizontal overflow on a phone, a clipped canvas, the explore grid
failing to collapse at `lg`, the code card's `max-h-[50vh]` — none of it is
observable in a unit test, and no phase below covers it. Responsive layout
stays a manual check on a real device.

If that ever proves insufficient, the cheapest remedy is not an end-to-end
suite but a single Playwright file of layout assertions — load two pages at
three viewports, assert the document never scrolls horizontally and the canvas
is not clipped — run locally rather than in CI. It is deliberately not part of
this plan.

Smaller gaps, all handled by fakes in Phase 0: `document.fonts`,
`window.devicePixelRatio`, the Fullscreen API, and `scrollIntoView`. Note also
that `canvas.getContext('2d')` returns `null` under jsdom and
`useCanvasFrames` already early-returns on null, so `VisualizationCanvas`
renders nothing in tests without failing — a passing test involving it is not
evidence that anything was drawn. Drawing is covered instead by Phase 6.

## Tooling

**Vitest**, and it is the right runner rather than merely a popular one,
because it runs the project's own Vite config and the engine's inputs depend
on that config in two ways another runner would have to reimplement:

- Listings are imported as `./code/array-binary-search.md?highlight` and
  tokenized by `vite/codeHighlight.ts`. A test that runs an algorithm needs
  the real listing, because the anchors it steps to live in it.
- Source uses the `#engine/...` subpath imports declared in `package.json`.

**`fast-check`** for the property-based phase, **`@testing-library/react`**
with jsdom for the component phase.

## Conventions

Tests are colocated as `*.test.ts` beside the file they cover, so a test moves
with its subject. Shared helpers live in `src/test/`, following the rule that
anything shared across routes sits at the top level under its own name.

Two Vitest projects, because the engine must not pay for jsdom: an `engine`
project on the `node` environment covering `src/engine/`, `src/canvas/` and
`src/utils/`, and an `app` project on `jsdom` covering `src/components/`,
`src/hooks/` and `src/routes/`.

---

## Phase 0 — Harness

Nothing is asserted yet; this is what makes a test runnable.

- [ ] Add dev dependencies: `vitest`, `@vitest/coverage-v8`, `jsdom`,
      `@testing-library/react`, `@testing-library/user-event`,
      `@testing-library/jest-dom`, `fast-check`.
- [ ] Configure the two Vitest projects described above via `test.projects`.
- [ ] Add a setup file for the `app` project: jest-dom matchers, and stubs for
      `document.fonts`, `window.devicePixelRatio`, `Element.scrollIntoView`
      and the Fullscreen API.
- [ ] Add a `check:test` script. The existing `check` script runs
      `/check:.*/` sequentially, so naming it this way joins it to the gate
      automatically.
- [ ] `src/test/boards.ts` — builders returning a board holding one known
      structure, so tests state their input literally rather than randomizing.
- [ ] `src/test/run.ts` — a `collectSteps` helper draining a run to
      completion, with a step cap that fails rather than hangs on a
      non-terminating generator.
- [ ] `src/test/trace.ts` — renders a step stream as readable text: each
      step's `activeLine` resolved through `lineText()` to the source line it
      highlights, beside a compact rendering of the structure.
- [ ] `src/test/canvas.ts` — a recording `CanvasRenderingContext2D` fake that
      logs calls and arguments in order.

## Phase 1 — Catalog invariants

One table over all thirteen algorithms, so a new algorithm is covered the
moment it is registered. The highest value per line in the plan: several of
these failures are today only discoverable by a person clicking through the
app.

- [ ] Every algorithm runs to completion on a representative input without
      throwing. `stepper` throws when an algorithm steps to a line its listing
      does not name, and that error is currently only reachable at runtime, on
      whichever branch happens to contain it.
- [ ] Every anchor a listing _declares_ is reached by at least one run across
      a corpus of inputs. This is the converse direction, and an unreached
      anchor means the listing shows a branch the engine never models — which
      is precisely a code-versus-animation mismatch.
- [ ] `board.callStack` is empty after every completed run. Binary search
      alone returns from four places, and a missed `board.return()` leaves a
      stale frame the next run stacks on top of.
- [ ] Every step carries at least one frame. Documented as always true in
      `docs/engine.md` and relied on by `useCanvasFrames`; asserted nowhere.
- [ ] Frame sanity across every frame of every run: coordinates finite,
      opacity within `[0, 1]`, no `NaN` reaching the renderer.

## Phase 2 — Session integrity

The paths a reader takes around a run rather than through it.

- [ ] Revert fidelity: for each algorithm and each prefix length _k_, snapshot
      the board, run _k_ steps, revert, and assert `board.toFrame()`
      deep-equals the frame captured before the run. This is the
      abandon-a-run path, it is subtle — merge sort adds structures of its own
      that the revert must take with it — and nothing tests it today.
- [ ] A run stepped to completion keeps its work: the structure afterwards
      reflects the operation.
- [ ] Every structure operation leaves the board consistent, and a second
      operation after the first still works.
- [ ] Arguments that do not parse yield `null` from the runner rather than a
      partially mutated board.

## Phase 3 — Execution traces

The phase that directly encodes the rule that an animation must depict what
the displayed code actually does.

A trace snapshots the _source text_ of each highlighted line rather than a
line number, so the snapshot file reads as an execution trace of the program
shown in the code card:

```
function binarySearch(array: number[], target: number): number {
if (array.length === 0) {
let left = 0;
let right = array.length - 1;
while (left < right) {
  const mid = Math.floor((left + right) / 2);
  if (array[mid] < target) {
```

A reviewer then verifies the animation matches the code by reading a diff
rather than by watching the app. It catches anchors that drift onto the wrong
line, steps yielded in the wrong order, and branches the engine models
differently from the listing — all of which look plausible on screen.

- [ ] A trace snapshot for one fixed input per algorithm.
- [ ] Each trace paired with the structure state at each step — values and
      variants, not coordinates — so the snapshot shows what the reader would
      have seen beside the line they would have been reading.
- [ ] Both branches of every algorithm that has one: the target found and
      absent, the empty structure, a single element.

## Phase 4 — Semantics

Property-based with `fast-check`: generate inputs, run the engine to
completion, and assert the final state matches a plain, obviously-correct
implementation of the same operation. This is what catches an algorithm that
animates beautifully and computes the wrong answer.

- [ ] Array: both sorts equal `[...values].sort(ascending)`; both searches
      agree with `indexOf` including the miss; insert and remove agree with
      `splice`.
- [ ] Linked list: the chain's values match the equivalent array operation for
      insert-at-head, insert-after and remove.
- [ ] Binary search tree: after insert and after remove, the in-order walk is
      sorted and the value is present or absent as expected. Remove must be
      exercised on all three cases — leaf, one child, two children.
- [ ] Max heap: the heap property holds at every node after push and after
      pop, and pop returns the maximum.
- [ ] Generators are constrained to produce the edge cases deliberately: empty
      structure, one element, duplicate values, target at either end.

## Phase 5 — Animation rules

Two rules this project holds itself to that are otherwise only checked by
watching the app, and that nothing else in the suite would catch.

- [ ] A structural change animates rather than merely recoloring: for any step
      where a node's position or the node count changes, `frames.length > 1`
      and the intermediate frames genuinely interpolate rather than jumping.
      A mutation that forgets its `animateFrom` and teleports is invisible to
      every other phase.
- [ ] Movement is continuous: within one step, no node moves further between
      consecutive frames than the animator's speed cap allows. This catches a
      `rearrange()` called without capturing positions first, which shows as a
      node snapping across the canvas.

## Phase 6 — Renderer and geometry

The drawing layer, covered without a canvas.

- [ ] `drawCanvasFrame` against the recording context: edges, then nodes, then
      labels — the documented order that keeps a node covering its edge ends.
- [ ] One draw-call snapshot per structure, from a known frame.
- [ ] `frameSize` and `canvasFramesSize`: bounds include node and label
      extents, edges never extend them, and a film strip sizes to its largest
      frame.
- [ ] `src/engine/layout.ts`: `capture` then `animateFrom` walks every moved
      node to where `rearrange` put it, and leaves a node absent from the
      capture where the layout placed it.

## Phase 7 — Pure utilities

Small, fast, and worth having before the component phase leans on them.

- [ ] `parseArgument`: blank is not zero, `integer` rejects decimals,
      non-numeric and non-finite input refused.
- [ ] `invalidArguments`: names exactly the fields that fail, respecting each
      argument's declared kind.
- [ ] `signature.ts`, `lineText`, `cn`, and `logger` prefixing output with
      `[code-canvas]`.

## Phase 8 — React layer

jsdom, with `VisualizationCanvas` stubbed where a test is not about drawing.

- [ ] Move the module-scope `isSupported` constant in
      `src/hooks/useFullscreen.ts` inside the hook first. As written it
      reads `document.fullscreenEnabled` once at import and cannot be
      varied per test.
- [ ] `useExploration` as a state machine: a run yields steps; `stop` mid-run
      reverts; a completed run keeps its work; an operation applied outside a
      run redraws; an unimplemented structure disables `canRun`.
- [ ] `CodeCard` highlights the line it is given and calls `scrollIntoView`
      when the active line changes.
- [ ] `AlgorithmCard` enables Run only once the arguments parse;
      `StructureCard` submits an operation with its values.
- [ ] Routing with `createMemoryHistory`: `/` renders the catalog, a deep link
      to a valid id renders the explore page, and an unknown id renders
      `AlgorithmNotFound` with the id in its message.
- [ ] `useCanvasFrames` with faked `requestAnimationFrame`: one frame drawn
      per tick, the last frame held, playback restarted when the step changes,
      and replayed once `useFontsReady` flips.

## Phase 9 — Randomness

Deferred to last because nothing above needs it — every phase states its input
literally, which a trace assertion requires anyway.

- [ ] Give `src/utils/random.ts` a seam. It calls `Math.random()` directly and
      `createRandomStructure` and every `fillRandomly` go through it, so a
      structure cannot be fixed from outside.
- [ ] `randomMaxHeapArray` returns an array satisfying the heap property;
      `uniqueRandomNumberArray` has no duplicates and clamps rather than
      looping forever when asked for more than the range holds.
- [ ] `createRandomStructure` builds each of the four structures named and
      laid out, and `isStructureImplemented` agrees with the registry.

---

## Order and rationale

Phases 1 and 2 first: they are small, they cover all thirteen algorithms at
once, and they close the failures that currently reach the browser. Phase 3
next, because it is what makes the code-versus-animation property reviewable
by a human. Phase 4 then catches wrong answers, and 5 onwards fill in.

Phases 6 to 9 are independent of each other and can be taken in any order as
the code they cover is touched.

## Deliberately not covered

Tailwind class strings, component markup snapshots, canvas pixel output, the
exact colors of node variants, and layout constants. All of them change for
cosmetic reasons, and a test that fails on a cosmetic change trains people to
update snapshots without reading them.

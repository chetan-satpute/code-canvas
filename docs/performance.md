# Performance

A review of two questions asked of the v2 app: whether the bundle needs code
splitting, and whether the engine should run in a Web Worker. The answer to
both is no for the reasons below, and in both cases the measurement turned up
something else worth doing instead.

Measured against the tree at `89d7b88` — the bundle on a production build with
sourcemaps attributed back to their modules, the engine by stepping every
algorithm to completion under Node and timing each `next()`.

## Part one — code splitting

### What ships today

One JavaScript chunk and one stylesheet, loaded by every visitor to every
route:

| Asset       |    Raw |   Gzip |
| ----------- | -----: | -----: |
| `index.js`  | 453 kB | 121 kB |
| `index.css` |  34 kB | 7.6 kB |

Where the JavaScript goes, by source, as a share of the raw bundle:

| Source                                                      |    Raw | Share |
| ----------------------------------------------------------- | -----: | ----: |
| `react-dom`                                                 | 202 kB | 45.8% |
| `src/constants/code/` — the thirteen tokenized listings     |  79 kB | 17.9% |
| `@tanstack/router-core`, `react-router`, `history`, `store` |  72 kB | 16.3% |
| `src/engine/algorithms/` — the thirteen runners             |  20 kB |  4.4% |
| `src/engine/structures/`                                    |  11 kB |  2.4% |
| `src/routes/home/`                                          |  11 kB |  2.5% |
| `src/routes/explore/`                                       |   9 kB |  2.0% |
| `src/engine/` core, `src/canvas/`, shared `src/`            |  20 kB |  4.5% |
| `react`, `scheduler`, `lucide-react`, `clsx`                |  17 kB |  3.8% |

Two things are already right and should stay that way. Shiki does not reach
the browser at all — `vite/codeHighlight.ts` tokenizes every listing during
the build and hands the app finished colors, so a highlighter that would have
been the largest dependency in the tree costs nothing at runtime. And
`lucide-react` is imported by name through `src/components/Icon.tsx`, so the
icon set costs 4.9 kB rather than the hundreds of kilobytes a namespace import
would pull in.

### Is splitting needed?

Not for the size of the bundle. 121 kB of gzipped JavaScript is a small
payload, and the single largest term in it — `react-dom` at 68 kB gzipped, 56%
of the wire weight — is needed by both routes and cannot be split away from
either. Splitting cannot touch the majority of what is being downloaded.

The compressed numbers deflate the case further. The listings look alarming at
79 kB raw, but they are JSON full of repeated theme colors and compress
extremely well: all thirteen together are 8.6 kB gzipped, and the largest
single one — `binary-search-tree-remove` — is 1.2 kB. Splitting them
per-algorithm would trade roughly 8 kB of transfer for thirteen extra requests
and an asynchronous boundary in a page that currently renders synchronously.

Adding up everything the home route downloads but never uses — twelve of the
thirteen listings, twelve of the thirteen runners, three of the four
structures' operations, and the whole explore route's component tree — the
ceiling on what a full split could remove from the landing page is about 19 kB
gzipped, taking it from roughly 121 kB to roughly 102 kB. A 16% improvement
on a payload that is already comfortable.

So the honest answer on size is: not yet.

### The reason to act anyway

The problem worth fixing is not the current byte count, it is the shape of the
dependency graph that produces it.

`src/constants/algorithms.ts` is an eager barrel. It statically imports all
thirteen tokenized listings and all thirteen engine runners, and
`src/constants/structures.ts` does the same for all four structures'
operations. Anything that touches either file pulls in the entire catalog.

The home page touches both. `CatalogSection` calls `getCatalog()`, which reads
`src/utils/algorithms.ts`, which imports both barrels — so the landing page,
which only ever renders an id, a title, a description and a structure id per
row, downloads every listing, every runner and the whole engine to do it.

That coupling is what makes the cost grow. Every algorithm added to the
catalog adds its listing and its runner to the landing page's payload, whether
or not anyone opens it. At thirteen algorithms the catalog's payload is 8.6 kB
gzipped of listings plus 8.1 kB of runners; at forty it is roughly three times
that, and the landing page still pays all of it for four strings per row.

Route-level splitting alone does not fix this, which is the key point. Making
`ExplorePage` lazy while `CatalogSection` still reaches the barrel leaves the
whole engine and every listing in the home chunk regardless — they are
statically reachable from the route that was not split. The barrel has to come
apart first or nothing else pays off.

### Strategy

In order. Each tier is worth doing only once the one above it is in place.

#### Tier 1 — separate catalog metadata from catalog payload

This is the load-bearing change, and it involves no asynchronous code at all.

Split each barrel in two along the line the consumers already fall on:

- **Metadata** — `id`, `structureId`, `title`, `description`, `args` for
  algorithms; `title`, `description` and the operations' ids, labels and
  argument shapes for structures. Plain data, no imports from `#engine/`, no
  `?highlight` imports. This is everything the home page needs, and it stays
  small no matter how large the catalog grows.
- **Payload** — the `listing` and the `run` runner for an algorithm, the
  `apply` runner for a structure operation. Reached only by the explore page.

Even resolved eagerly, this alone removes the engine and all thirteen listings
from anything that renders only the catalog, and it caps the landing page's
growth at a few hundred bytes per algorithm rather than a kilobyte or two.

One consequence to design for: `isPlayable()` currently derives playability
from the _presence_ of a runner (`algorithm.run !== undefined`) plus
`isStructureImplemented()`. Once metadata no longer carries the runner, that
derivation is gone and playability has to be stated in the metadata instead —
either as a declared field or, in keeping with how the listings are handled,
computed during the build from which ids the payload module actually exports.
The build-time form is preferable because it cannot drift.

#### Tier 2 — split the explore route

`src/routes/router.ts` statically imports both page components, so `HomePage`
and `ExplorePage` are welded together. Replacing the explore route's
`component` with `lazyRouteComponent(() => import('./explore/ExplorePage.tsx'))`
gives the explore page, its eight components, its exploration hook and the
parts of the engine only it uses their own chunk.

This must be paired with preloading. Explore is the destination of every
catalog row and of every shared deep link; a reader who clicks a row and waits
for a chunk before anything paints is a worse experience than one who
downloaded 19 kB they did not need. `createRouter({ defaultPreload: 'intent' })`
fetches the chunk on hover or touch-start, which on the catalog page means it
is almost always already there by the time the click lands. Without it, this
tier trades bytes for a visible delay on the one interaction the whole product
is built around, and should not be done.

#### Tier 3 — per-algorithm payload chunks

Load an algorithm's listing and runner with a dynamic `import()` keyed by the
route's `algorithmId`, so opening one algorithm costs roughly 1 kB gzipped
instead of the catalog's whole 17 kB.

This is the tier to defer. It introduces a genuine loading state into
`ExplorePage`, which today reads `algorithm.listing` synchronously during
render and would need a pending state and a not-found path that survives an
async miss. At thirteen algorithms it saves too little to justify that. It
becomes the right call somewhere past twenty-five or thirty, or sooner if
listings grow much longer than the current ones.

#### What not to split

- **`react` and `react-dom`.** Both routes need them, so no split reduces what
  anyone downloads. A separate `vendor-react` chunk is defensible purely for
  returning-visitor caching — app code changes far more often than React does,
  and today a one-line copy edit invalidates all 121 kB. That is a caching
  argument, not a payload argument, and it is worth doing only alongside Tier 2
  when chunking is already being configured.
- **The engine core and canvas.** The hero on the home page runs a real linear
  search on a real board, so `#engine/board.ts`, `#engine/structures/array/`,
  `#canvas/` and the linear-search runner are first-paint dependencies of the
  landing page, not explore-only code.
- **The stylesheet.** One 7.6 kB gzipped Tailwind file for the whole app. There
  is nothing to gain and a render-blocking second request to lose.

## Part two — the engine in a Web Worker

No. The engine is not doing enough work to be worth moving, and the boundary
it would have to cross is the most expensive one in the design.

### What a step actually costs

Every algorithm was stepped to completion and each `generator.next()` timed.
`n` is the number of elements in the structure; the app builds arrays of five
to ten, so `n=30` is well past anything a reader can produce.

| Run                       | Steps | Frames | Total CPU | Slowest single step |
| ------------------------- | ----: | -----: | --------: | ------------------: |
| Linear search, `n=10`     |    23 |     23 |    0.4 ms |             0.20 ms |
| Binary search tree insert |    21 |     92 |    0.5 ms |             0.28 ms |
| Quick sort, `n=10`        |   207 |  1,159 |    2.7 ms |             0.32 ms |
| Merge sort, `n=10`        |   380 |  3,278 |   14.9 ms |             0.92 ms |
| Quick sort, `n=30`        |   848 |  6,917 |   32.5 ms |             0.60 ms |
| Merge sort, `n=30`        | 1,410 | 13,969 |   80.6 ms |             1.15 ms |

The slowest single step anywhere in the catalog, at three times the largest
structure the app will build, is **1.15 ms** — about 7% of one 16.7 ms frame
budget. The 80 ms total for merge sort at `n=30` is not a pause: it is spread
across 1,410 separate steps, each one advanced by its own click or timer, with
whole animation playbacks in between.

There is no jank here to move off the main thread. A worker would be pure
overhead.

### What the boundary would cost

The overhead is not hypothetical, and it is far larger than the work it would
displace.

A step carries its frames as data — `frames: CanvasFrame[]`, one full
serialization of the board per animation tick — and every one of them would
have to be structured-cloned out of the worker. Merge sort at `n=10` produces
3,278 frames of roughly 1.1 kB each; at `n=30` it is 13,969 frames of roughly
3.1 kB. That is several megabytes of copying per run at the size the app
actually uses, and tens of megabytes at the size it was measured to, replacing
between 15 and 80 ms of computation. Today those frames cross as object
references and cost nothing.

Two parts of the design also do not survive the move at all:

- `CoreBoard.snapshot()` returns a closure — `() => void` — and
  `useExploration` holds it in a ref to revert a run the reader abandons.
  Functions are not cloneable. The undo would have to be re-expressed as a
  message protocol.
- Every engine entry point becomes asynchronous. `run`, `nextStep` and
  `applyOperation` currently mutate and read back synchronously, and
  `createRandomStructure` runs inside a `useState` initializer. All of them
  would return promises, which means a pending state in a page that today
  renders its first structure on the first paint.

So the trade is: give up synchronous rendering, add a message protocol for
undo, and pay megabytes of copying, in order to relieve a main thread that was
never more than 7% busy in its worst moment.

### The boundary is already drawn, which is the useful part

Worth recording, because it is what makes this a five-minute answer rather
than a redesign: the engine already hands the renderer nothing but plain data.
`CanvasFrame` is arrays of nodes, edges and labels holding numbers and
strings, produced by `serializeCoreFrame`; `CallStackFrame` is the same for
the call stack. No class instances and no functions cross from `#engine/` to
the components.

That means if the engine ever _does_ become expensive — much larger
structures, or an algorithm whose per-step work is genuinely heavy — the move
to a worker is available and mostly mechanical, blocked only by the snapshot
closure. It does not need to be prepared for in advance, and no code should be
shaped around the possibility now.

### The finding that is real

The benchmark does surface something, and it is not a threading problem.

Frame count is driven by pixel distance, not by algorithm work. `animateMove`
advances one pixel per frame up to a 60-frame cap, and `CoreBoard.pushFrame()`
serializes the _entire board_ on each of those ticks. Merge sort at `n=10`
does 380 steps of real work and materializes 3,278 complete board snapshots to
show them. The ratio gets worse as structures grow, because each snapshot also
gets bigger.

Nothing is wrong today — peak memory is only ever one step's frames, and the
per-step cost stays near a millisecond. But if the cost of animation ever
needs to come down, the lever is to stop materializing intermediate frames and
interpolate between a start and an end pose at draw time. That is a change to
how the renderer consumes a step, and it would also be the thing that makes a
worker cheap, by shrinking what crosses the boundary from every tween frame to
two poses. It is recorded here as the next place to look, not as work to do
now.

## A larger lever than either question

The render-blocking Google Fonts stylesheet in `index.html` requests six
families across roughly forty-six declared weights and styles, including two
sixteen-weight Spectral families and full Devanagari glyph sets. That is very
likely a bigger first-paint cost than the entire JavaScript bundle, and it
blocks rendering in a way the bundle does not.

This is already a known and deliberate trade — `src/index.css` documents the
multi-language rationale and names the mitigation, which is to subset with
Google Fonts' `text=` parameter or `pyftsubset` rather than to drop the
language-specific faces. It is recorded here only so that a future
optimization pass weighs it before spending effort on a 16% JavaScript win.

## Incidental finding

All thirteen algorithms currently declare a `run` runner and all four
structures are registered in `src/engine/structures/registry.ts`, so
`isPlayable()` returns true for every entry in the catalog and the `soon`
badge in `AlgorithmRow` never renders. The copy in `CatalogSection` still
explains what the badge means. Neither is wrong — both exist for algorithms
added ahead of their engine support — but the badge is currently unreachable,
and Tier 1 changes how playability is determined, so the two should be
reconciled at that point.

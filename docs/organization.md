# How the v2 source is organized, and where it should change

Written after the port finished — all thirteen algorithms and all four
structures play — when the shape of the code could be read as a whole for the
first time rather than one algorithm at a time.

This is a review, not a plan of record. Each finding says what is there today,
why it reads as a seam rather than a design, and what the consolidated form
would be. Nothing here is a bug: the code works, and most of these are places
where the same idea was written down two, three or four times because each
occurrence arrived in its own commit.

## The conventions that already hold

These are working and nothing below proposes changing them. They are written
out because they are what makes the rest of the review legible, and because
they were never stated anywhere.

**Top-level folders are layers, and imports across them use the `#` alias
while imports inside one are relative.** `src/engine/algorithms/array/merge-sort.ts`
reaches its sibling animator as `../../animation.ts` and the canvas constants
as `#canvas/elements/node.ts`. The same rule holds in the routes:
`ExplorePage.tsx` imports `./components/CodeCard.tsx` but
`#components/Card.tsx`. The alias is therefore a signal that a boundary is
being crossed, which is worth keeping deliberately.

**The engine imports no React, and the canvas imports no engine.** `src/canvas/`
holds the drawing primitives and their sizes; `src/engine/elements/` holds the
mutable objects that serialize into them. The two mirror each other on purpose
— the mutable side is what an algorithm writes, the plain side is what crosses
into React — and the duplication of field names between `CoreNode` and
`CanvasNode` is the price of that boundary, not an accident.

**Route-local versus global is expressed by location.** Anything one route
uses lives under `src/routes/<route>/{components,hooks}/`; anything two routes
use is promoted to `src/{components,hooks,utils}/`. `useMediaQuery` living in
`routes/home/hooks/` despite being perfectly generic is correct under this
rule, and should move only when a second route needs it.

## Findings

Ordered by how much they reduce, not by effort.

### 1. `mark` and `unmark` are written out four times

`engine/algorithms/binary-search-tree/insert.ts`,
`engine/algorithms/binary-search-tree/remove.ts`,
`engine/algorithms/linked-list/insert-after.ts` and
`engine/algorithms/linked-list/remove.ts` each end with the same two private
helpers:

```ts
function mark(node, name) {
  node.variant = 'secondary';
  node.setLabel('bottom', name);
  node.rearrange();
}

function unmark(node) {
  node.variant = 'primary';
  node.setLabel('bottom');
  node.rearrange();
}
```

Three copies are character-for-character identical; the linked list's remove
takes a `variant` parameter as well. What they express — _a variable in the
listing points at this node_ — is a first-class idea in the visual language,
not a local convenience. It belongs in the engine, beside `CoreNode`: one
`markNode(node, name, variant = 'secondary')` and one `unmarkNode(node)`, with
the variant defaulted so the three callers that never pass one read as they do
now.

### 2. Three implementations of "name the cursors on a row"

The same routine appears in three places, in three shapes:

- `engine/structures/max-heap/cursors.ts` — `mark(heap, cursors)`, the only one
  that is a shared module.
- `engine/algorithms/array/binary-search.ts` — `show(array, left, right, marks, mid)`
  and `reset(array)`.
- `engine/algorithms/array/quick-sort.ts` — `markCursors(array, low, high, i, j)`
  and `clearCursors(array, low, high)`.

All three do the same four things: clear the bottom labels over a range, set
the variant of the marked cells, join the names of cursors that land on one
cell into a single label (`'i j'`, `'left mid'`), and `rearrange`. The
name-joining in particular is a visual rule the reader learns once and should
not be re-derived per algorithm.

The consolidated form is one `cursors` module over a row of `CoreNode`s —
`engine/cursors.ts`, taking the nodes rather than the structure, since the heap
marks pairs and the array marks cells. Each caller keeps only what is genuinely
its own: binary search's rule that the window outside `[left, right]` goes back
to resting, quick sort's rule that the pivot keeps its own label.

### 3. Every structure re-implements its own name label

`CoreArray`, `CoreLinkedList` and `CoreBinarySearchTree` each declare
`name?: CoreLabel`, each define an identical `setName`, each position it at
`x - NODE_WIDTH, y` inside `rearrange`, and each call `this.name?.serialize(frame)`.
`CoreMaxHeap` does the same twice over, once per view.

Naming a structure is something every structure does, and `CoreStructure`
already owns the two coordinates the label is derived from. Moving the field,
`setName`, the positioning and the serialization onto the base class removes
four copies and makes it one fewer thing to remember when a fifth structure is
added — where today the only way to know a structure should carry a name is to
read another structure. The heap overrides it to place a second label, which
is exactly what a base class with one hook should support.

### 4. The array's `swap` is hidden inside quick sort

Two shared animations exist for arrays: `engine/structures/array/assign.ts`
holds `assign(board, to, index, from)`, used by merge sort, insert value and
remove value. But `swap` — the mirror of it, with the same care about routing
out of the row — is a private function at the bottom of
`engine/algorithms/array/quick-sort.ts`, while the heap's equivalent is a module
of its own at `engine/structures/max-heap/swap.ts`.

It should be `engine/structures/array/swap.ts`. It is not that a second caller
exists today; it is that the placement currently tells a reader something false
— that assignment is a property of arrays and exchange is a property of quick
sort — when `docs/porting.md` spends two paragraphs establishing that they are
the same kind of thing, chosen by reading the statement in the listing.

### 5. Random construction is split across three places, differently per structure

`engine/structures/registry.ts` builds the array inline — the count, the values,
the name, the `rearrange`. For the other three it imports `fillRandomly` from
that structure's `operations.ts`, under four aliases (`fillTree`,
`fillLinkedList`, `fillHeap`) because the exports all share a name. The bounds
each `fillRandomly` draws from are `NODE_COUNT_MIN`/`NODE_COUNT_MAX`, exported
from three different `operations.ts` files with two different pairs of values.

Three problems in one: the array is built unlike its siblings, the random
constructor lives in the file about user-applied edits, and the registry has
to rename its imports to assemble them.

Give each structure folder a `random.ts` exporting one `createRandom<Name>()`
that returns a laid-out, named structure — the bounds are private to it — and
the registry becomes a four-line map from id to constructor with no aliases and
no structure-specific knowledge in it at all. `operations.ts` keeps only what
the sidebar applies, and the randomize operation calls the same constructor.

### 6. Optionality that the finished port has made dead

Every one of the thirteen catalog entries now has `run`, and every one of the
fourteen structure operations has `apply`. The machinery for the other case is
still fully wired:

- `Algorithm.run?` and `StructureOperation.apply?` in the catalogs.
- `isPlayable` in `utils/algorithms.ts` and `isStructureImplemented` in the
  engine registry, the second existing only to feed the first.
- `createRandomStructure` returning `CoreStructure | null`, and the three
  `core === null` branches that guard against it in `useExploration`.
- `runnable` on `AlgorithmCard` and `applicable` on `StructureOperationRow`,
  the disabled Run and Apply buttons, and the "This algorithm is not playable
  yet." paragraph.
- The `soon` badge in `AlgorithmRow`, and the sentence in `CatalogSection`
  that explains it to the reader.

Making `run` and `apply` required deletes all of it, and lets
`createRandomStructure` return a structure rather than a nullable one, which is
what removes the null branches from the hook. The honest cost: if a fourteenth
algorithm is ever added listing-first, the "soon" path has to be rebuilt, and
it is spread over six files rather than one. Weigh that against the fact that
every reader of the explore page today has to hold a state that cannot occur.

### 7. `engine/algorithm.ts` holds the operation contract too

That file defines `AlgorithmContext`, `AlgorithmRunner`, `algorithmFor` — and
also `OperationRunner` and `operationFor`, which are a different thing: an
operation is not stepped, takes no listing, and yields nothing. The catalog of
structures imports `OperationRunner` from a file named `algorithm.ts` to say so.

The same confusion is repeated four times below it: each structure folder has
an `algorithm.ts` whose job is to export both binders —
`defineArrayAlgorithm` and `defineArrayOperation`.

Split it: `engine/algorithm.ts` and `engine/operation.ts` at the top, and
rename the per-structure file to `define.ts`, which is what it is. Four files
of four lines each is fine; four files named after half their contents is not.

### 8. `src/constants/` is not constants

It holds two catalogs that import engine runners and markdown listings — the
most behavior-bearing data in the app — plus `code/`, thirteen markdown files
that are content. Meanwhile the functions that query those catalogs
(`findAlgorithm`, `getStructure`, `getCatalog`, `isPlayable`) live in
`src/utils/algorithms.ts`, which is a util only in the sense that it is not a
component, and which imports the engine registry to answer one of them.

The catalog is its own layer, between the engine and the routes, and should
look like one:

```
src/catalog/
  algorithms.ts     the entries
  structures.ts     the entries
  catalog.ts        findAlgorithm, getStructure, getCatalog
  code/             the listings
```

`src/constants/` then either disappears or keeps only genuine constants — of
which there is currently one worth the file, below.

### 9. Two identical argument interfaces, and a third that unifies them

`AlgorithmArgument` (in `constants/algorithms.ts`) and
`StructureOperationArgument` (in `constants/structures.ts`) are the same three
fields, declared twice with the same comment. `utils/argument.ts` already
declares a third, `CheckableArgument`, whose only reason to exist is that the
first two are separate.

One exported `Argument` in `utils/argument.ts`, imported by both catalogs,
replaces all three. This is worth doing even if nothing else in this document
is: the file that validates arguments should own what an argument is.

### 10. The argument form is written twice

`AlgorithmCard` and `StructureOperationRow` each hold a `values` record and an
`invalid` list, each define the same `handleChange` that clears a field's
invalid mark as soon as it parses, and each define a submit handler that
re-validates, sets the rejected names and bails. The only differences are the
button's label and that the operation row clears its fields on success.

Extract a `useArgumentFields(args)` hook into `routes/explore/hooks/` returning
`{ values, invalid, setValue, submit, reset }`. Both components then render
fields and a button, which is all either is about.

### 11. Three hand-rolled copies of the button's look, on anchors

`Button` renders a `<button>`, so anything that navigates cannot use it — an
anchor inside a button is invalid HTML, and `Button`'s `enabled:` variants
never match an anchor anyway. The consequence today is
`catalogLinkClasses` in `ExploreHeader.tsx` (an outline button at size md,
re-typed) and `ctaClasses` + `primaryCtaClasses` + `secondaryCtaClasses` in
`HeroSection.tsx` (a primary and an outline at size lg, re-typed). The
comment above the first one explains the situation accurately and then
duplicates forty utilities anyway.

The recipe, not the component, is what should be shared: export
`buttonClasses({ variant, size })` from `components/Button.tsx`, have `Button`
itself call it, and have the three links call it too. This deliberately does
not wrap TanStack's `Link` — that decision was taken already, and it holds:
the router's link types are generated from the real route tree and a wrapper
would replace them with a hand-maintained union.

### 12. The code listing is rendered twice

`CodeCard` and `HeroPreview` both map a `CodeLine[]` into an `<ol>` of rows,
each with a gutter number, the same active-line gradient, and `CodeTokens`
inside a `<code>`. `HeroPreview` carries a comment explaining why it does not
reuse `CodeCard`, and the reason is sound — `CodeCard` scrolls the active line
into view, which on the hero would drag a scrolling reader back up the page.

But that reason covers one `useEffect`, not the markup. A presentational
`components/CodeListing.tsx` taking `{ lines, activeLine, size }` would be used
by both; `CodeCard` keeps the scroll effect and the `Card` around it, and the
hero keeps its own header row. The two would then be unable to drift in how a
highlighted line looks, which is the thing that matters — it is the same
highlight in both places by design.

### 13. Small things

- `repositoryUrl` is declared identically in `HomeHeader.tsx` and
  `HomeFooter.tsx`. One `src/constants/site.ts` (or whatever survives of
  `constants/`) holds it.
- `App.tsx` renders `AppRouter.tsx` and nothing else; `AppRouter` renders
  `RouterProvider` and nothing else. Two files, one of them in `components/`
  though it is not reusable, to express one line. Collapse them: either `App`
  renders the provider, or `main.tsx` does and `App` goes.
- `StructureId` is declared in the catalog, so the engine registry — which
  cannot import the catalog without inverting the layering — keys
  `randomStructures` by `string`. The result is that adding a structure to the
  catalog and forgetting the registry is a runtime null rather than a type
  error. Moving `StructureId` into the engine (it is, after all, the set of
  structures the engine implements) and having the catalog import it restores
  the check in the direction that already compiles.

## A reasonable order

The first three are pure deletion inside the engine, with no signature visible
to the routes changing:

1. §1 `markNode`/`unmarkNode`, §2 the cursors module, §3 the name label on
   `CoreStructure`.
2. §4 array `swap` and §5 per-structure `random.ts` — file moves, mechanical.
3. §9 the single `Argument` type, then §6 the dead optionality, which touches
   the most files but every change is a deletion.
4. §7 and §8, the two renames, together: both are churn in import lines and
   doing them in one commit keeps that churn to one review.
5. §10, §11, §12 in the UI, in any order.
6. §13 whenever convenient.

Items 1 and 2 are invisible to `pnpm dev`; items 3 onwards all have something
to look at. As `docs/porting.md` notes, `pnpm check` proves a change compiles
and cannot prove an animation still reads correctly — anything in the engine
wants the affected algorithms watched once in the browser before it is called
done.

## What this review deliberately does not propose

- **Merging `src/canvas/` into `src/engine/`.** The duplication between
  `CanvasNode` and `CoreNode` is the boundary doing its job.
- **Grouping by feature, v1-style** — a folder per structure-operation holding
  its listing, its generator and its layout. v2 split by kind on purpose and the
  catalogs are what reassemble it; the findings above move files _within_ that
  split, never back across it.
- **A store, or lifting `useExploration`'s state.** One page owns a run, which
  is why there is no Redux here and should not be.
- **Tests.** There is no suite and this review does not argue for one; the
  verification described in `docs/porting.md` — running an algorithm against a
  plain implementation of its own listing, and checking every anchor is reached
  — is the thing that found a real defect, and it remains the highest-value
  thing to automate if anything here is.

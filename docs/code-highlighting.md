# Code highlighting

The code card shows an algorithm's listing in color, and the call stack shows
each frame's signature in the same colors. Both are highlighted by
[Shiki](https://shiki.style), but Shiki never reaches the browser: everything
it produces is computed while Vite builds or serves the app.

## Why at build time

A listing is static text, so nothing about its colors can change at runtime.
Shipping Shiki to color it would mean shipping its core, a regex engine, the
TypeScript grammar and a theme — several hundred kilobytes — to produce a few
kilobytes of colored tokens, plus a frame of uncolored code on first paint.
The build does the work once and the browser receives the result.

Never import `shiki` or `@shikijs/*` from `src/`. They are dev dependencies,
and the only file that uses them is `vite/codeHighlight.ts`.

## The pipeline

1. A listing is a markdown file in `src/catalog/listings/`, named after the
   algorithm id it belongs to (`array-linear-search.md`). The code is the
   first fenced block, or the whole file if there is no fence. Anything after
   the opening backticks (`ts`, `ts title="x"`) is the fence's info string and
   never part of the code.
2. `src/catalog/listings.ts` discovers every listing with
   `import.meta.glob('./listings/*.md', { query: '?highlight' })`. Each file
   becomes its own lazily loaded chunk, so the home page and other algorithms
   never download it.
3. The `?highlight` suffix routes the import to the Vite plugin in
   `vite/codeHighlight.ts`. The plugin reads the file, extracts the code,
   strips the line markers described below, tokenizes the code with Shiki,
   and returns a generated module whose default export is a `Listing`
   (`src/utils/code.ts`):

   ```ts
   {
     lines: [[{ content: 'function', color: '#BB9AF7' }, …], …],
     anchors: { enter: 1, loop: 2, compare: 3, … },
   }
   ```

4. The explore route's loader in `src/router.tsx` awaits
   `loadListing(algorithm.id)` before the page renders, so the code card is
   colored on first paint with no loading state. An algorithm in the catalog
   with no listing file renders the not-found page. A listing chunk that fails
   to load — typically in a tab opened before a deploy, asking for a chunk
   the new build no longer has — renders an error page whose Reload button
   fetches the current build.
5. `CodeCard` and the home page's hero draw each line through `src/components/CodeTokens.tsx`, one
   `<span>` per token with the token's color, and mark the active line.

The plugin builds a single highlighter, lazily, with only the TypeScript
grammar, the tokyo-night theme and Shiki's JavaScript regex engine. The theme
is imported once at the top of the plugin and passed as an object everywhere
it is needed, so changing it is a one-line edit.

In dev the plugin registers the listing file as a watch dependency, so saving
a listing re-runs the plugin for it.

## Naming lines

A step of a running algorithm has to say which line of the listing it is on.
Hand-counted line numbers — what v1 did — silently point every later step at
the wrong line as soon as a line is inserted above them. Instead a listing
names its interesting lines with a `/*#name*/` marker:

```ts
/*#compare*/ if (array[i] === target) {
} /*#exit*/
```

The plugin removes markers before tokenizing, so they never appear in the
rendered listing, and records each name's 1-based line number in `anchors` —
the same numbering as the code card's gutter.

Where a marker goes is dictated by prettier, which formats code inside
markdown fences and moves comments off some lines without any error:

| Marker                               | What prettier does                    |
| ------------------------------------ | ------------------------------------- |
| leading a line (`/*#a*/ if (x) {`)   | leaves it, unless the line starts `}` |
| trailing a line (`return 0; /*#a*/`) | leaves it, unless the line ends `{`   |
| trailing a line ending in `{`        | moves it onto the next line           |
| leading a line starting with `}`     | moves it into the block above         |

So a marker leads its line, except on a line starting with `}`, where it
trails. A `} else {` line cannot be marked at all — prettier moves a marker
off either side — so mark a line inside one of its blocks instead.

The build fails on any placement prettier would move, on a marker in the
middle of a line or on a line with no code, on a line with two names, and on a
name used on two lines. Each of these would leave a step pointing somewhere
the author did not mean, with nothing to show it.

## Code that only exists at runtime

Call stack signatures are built while a run is stepping, so they cannot be
tokenized ahead of time. Each argument is either a value bound to its
parameter or a bare structure name:

```text
linearSearch(array: [1,2,3,4,5], target: 45)
insert(bst, value: 46)
```

`src/features/explore/utils/signature.ts` splits a signature into pieces with a small regular
expression and colors each piece from a palette.

The memory card paints each variable's value with the same function, since a
value is written exactly as it appears as an argument in a signature.

The palette comes from the virtual module `virtual:code-theme`, which the
same plugin generates. It tokenizes a fixed probe snippet with the real theme
and reads back the color the theme gave each kind of piece — function name,
parameter, variable, number, constant (`true`, `null`, `NaN` and the other
literal words), string, separator, punctuation. Because the
colors are taken from the theme rather than written down, signatures cannot
drift from the listings. If the theme ever stops coloring a piece of the
probe, the build fails rather than painting signatures wrongly.

Both generated modules are typed in `src/code.d.ts`.

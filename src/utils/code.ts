// The rendered form of highlighted code. Listings are tokenized into this
// shape at build time by `vite/codeHighlight.ts`, which is the only place
// shiki runs — so this file stays free of imports and can be shared across
// that boundary.

export interface CodeToken {
  content: string;
  // Absent where the theme styles nothing, leaving the element's own color.
  color?: string;
  italic?: boolean;
  bold?: boolean;
}

// The tokens of a single line, in order. An empty line has no tokens.
export type CodeLine = CodeToken[];

// Named lines of a listing, mapped to 1-based line numbers the way the code
// card's gutter counts. An algorithm yields `step('compare')` rather than a
// hand-counted number, so editing a listing cannot silently point a step at
// the wrong line.
export type CodeAnchors = Record<string, number>;

export interface Listing {
  lines: CodeLine[];
  anchors: CodeAnchors;
}

// The few theme colors needed to highlight code that only exists at runtime.
// Extracted from the theme at build time rather than written down, so it
// cannot drift from the listings.
export interface CodePalette {
  function: string;
  parameter: string;
  variable: string;
  number: string;
  // `true`, `null`, `NaN` and the other literal words a value can be.
  constant: string;
  string: string;
  separator: string;
  punctuation: string;
}

import theme from '@shikijs/themes/tokyo-night';
import fs from 'node:fs/promises';
import { createHighlighterCore, type HighlighterCore } from 'shiki/core';
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';
import type { Plugin } from 'vite';

import type {
  CodeAnchors,
  CodeLine,
  CodePalette,
  Listing,
} from '../src/utils/code.ts';

const LANG = 'typescript';

// `import listing from './x.md?highlight'` yields the tokenized listing.
const QUERY = '?highlight';

// `import { palette } from 'virtual:code-theme'` yields the colors needed to
// highlight code the app only builds at runtime.
const PALETTE_ID = 'virtual:code-theme';
const RESOLVED_PALETTE_ID = '\0' + PALETTE_ID;

// TextMate packs font styles into a bitmask; only these two are rendered.
const ITALIC = 1;
const BOLD = 2;

// Built from `shiki/core` rather than the `shiki` bundle so only one grammar
// and one theme are loaded. None of it reaches the browser — the plugin hands
// the app finished tokens.
function createHighlighter(): Promise<HighlighterCore> {
  return createHighlighterCore({
    langs: [import('@shikijs/langs/typescript')],
    themes: [theme],
    engine: createJavaScriptRegexEngine(),
  });
}

function tokenize(highlighter: HighlighterCore, code: string) {
  return highlighter.codeToTokens(code, { lang: LANG, theme }).tokens;
}

// The first fenced block, or the whole file when it has no fence. Everything
// after the opening backticks is the fence's info string (`ts`, or
// `ts title="x"`), never code. Only blank lines are trimmed from the start, so
// an indented first line keeps its indentation.
function extractCode(markdown: string): string {
  const fenced = /```[^\n]*\n([\s\S]*?)```/.exec(markdown);
  const code = fenced === null ? markdown : fenced[1];

  return code.replace(/^(?:[ \t]*\n)+/, '').trimEnd();
}

// A `/*#name*/` marker names the line it sits on, so an algorithm can yield
// `step('compare')` instead of a hand-counted line number. Stripped here,
// before shiki tokenizes, so a marker never reaches the rendered listing and
// the tokens are the same as if it had never been written.
//
// Prettier formats code inside markdown fences, and it moves a comment off
// some lines: a trailing one off a line ending in `{` onto the next line, and
// a leading one off a line starting with `}` into the block above. Either
// would silently point the anchor at the wrong line, so a marker leads its
// line unless the line starts with `}`, where it trails instead — the only two
// places prettier leaves it.
const MARKER_PATTERN = /\/\*#([A-Za-z][\w-]*)\*\//g;

function extractAnchors(code: string): { code: string; anchors: CodeAnchors } {
  const anchors: CodeAnchors = {};

  const lines = code.split('\n').map((line, index) => {
    // 1-based, as the code card's gutter counts.
    const lineNumber = index + 1;

    // Any misplaced marker would leave a step pointing somewhere the author
    // did not mean, and they would never see it — so fail the build instead.
    const fail = (reason: string): never => {
      throw new Error(`Listing line ${lineNumber}: ${reason}`);
    };

    const markers = [...line.matchAll(MARKER_PATTERN)];
    if (markers.length === 0) return line;
    if (markers.length > 1) fail('a line takes one /*#name*/ marker');

    const [{ 0: marker, 1: name, index: at }] = markers;
    const before = line.slice(0, at);
    const after = line.slice(at + marker.length);

    const leads = before.trim() === '';
    const stripped = (
      leads ? before + after.replace(/^ /, '') : before
    ).trimEnd();
    const text = stripped.trim();

    if (text === '') fail(`'${name}' marks a line with no code`);
    if (!leads && after.trim() !== '')
      fail(`'${name}' must lead or trail its line`);
    if (text.startsWith('}') && text.endsWith('{'))
      fail(
        `'${name}' cannot mark a '} … {' line; prettier moves it either way`,
      );
    if (leads && text.startsWith('}'))
      fail(`'${name}' must trail a line starting with '}'`);
    if (!leads && text.endsWith('{'))
      fail(`'${name}' must lead a line ending in '{'`);

    if (Object.hasOwn(anchors, name))
      throw new Error(`Listing names '${name}' on more than one line`);

    anchors[name] = lineNumber;

    return stripped;
  });

  return { code: lines.join('\n'), anchors };
}

function toLines(highlighter: HighlighterCore, code: string): CodeLine[] {
  return tokenize(highlighter, code).map((line) =>
    line.map((token) => {
      const fontStyle = token.fontStyle ?? 0;

      // The false cases are left undefined so they drop out of the JSON.
      return {
        content: token.content,
        color: token.color,
        italic: (fontStyle & ITALIC) === 0 ? undefined : true,
        bold: (fontStyle & BOLD) === 0 ? undefined : true,
      };
    }),
  );
}

// Every palette color is read back off a token the theme itself colored, so
// the call stack is painted in the same colors as the listing beside it.
// A declaration rather than a call, because it is the only context where the
// grammar names a parameter — which is what a call stack frame shows.
const PALETTE_PROBE =
  "function call(name: number) { call(other, 42, true, 'text'); }";

function buildPalette(highlighter: HighlighterCore): CodePalette {
  const [line] = tokenize(highlighter, PALETTE_PROBE);

  const colorOf = (content: string): string => {
    const color = line.find((token) => token.content === content)?.color;

    // Only reachable if the grammar or theme stops resolving the probe, which
    // would silently mispaint every signature — so fail the build instead.
    if (color === undefined)
      throw new Error(
        `Theme '${theme.name}' left '${content}' of the palette probe uncolored`,
      );

    return color;
  };

  return {
    function: colorOf('call'),
    parameter: colorOf('name'),
    variable: colorOf('other'),
    number: colorOf('42'),
    constant: colorOf('true'),
    string: colorOf('text'),
    separator: colorOf(','),
    punctuation: colorOf('('),
  };
}

function codeHighlight(): Plugin {
  let highlighter: Promise<HighlighterCore> | null = null;

  const getHighlighter = () => (highlighter ??= createHighlighter());

  return {
    name: 'code-canvas:code-highlight',

    resolveId(id) {
      return id === PALETTE_ID ? RESOLVED_PALETTE_ID : null;
    },

    async load(id) {
      if (id === RESOLVED_PALETTE_ID) {
        const palette = buildPalette(await getHighlighter());

        return `export const palette = ${JSON.stringify(palette)};`;
      }

      if (!id.endsWith(QUERY)) return null;

      const file = id.slice(0, -QUERY.length);

      // Editing a listing in dev should reload it, and the file is only ever
      // read here — the bundler never sees it as an input of its own.
      this.addWatchFile(file);

      const { code, anchors } = extractAnchors(
        extractCode(await fs.readFile(file, 'utf8')),
      );

      const listing: Listing = {
        lines: toLines(await getHighlighter(), code),
        anchors,
      };

      return `export default ${JSON.stringify(listing)};`;
    },
  };
}

export default codeHighlight;

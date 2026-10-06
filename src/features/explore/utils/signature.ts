import { palette } from 'virtual:code-theme';

import type { CodeLine } from '#utils/code.ts';

// Call stack signatures are built while a run is stepping, so unlike the
// listings they cannot be tokenized ahead of time. They always take one of
// two shapes per argument — a value bound to its parameter, or a bare
// structure name:
//
//   linearSearch(array: [1,2,3,4,5], target: 45)
//   insert(bst, value: 46)
//
// That is far simpler than TypeScript at large, so this splits one into the
// pieces that get their own color, rather than carrying a grammar and a
// highlighter into the browser for it.
//
// A minus is read as part of the number after it, since a signature has no
// subtraction and a value can be negative.
const TOKEN_PATTERN = /\s+|[A-Za-z_$][\w$]*|-?\d[\w.]*|'[^']*'|"[^"]*"|./g;

// Words that are values rather than names, so they take the color the
// listing gives them instead of the variable color.
const CONSTANTS = new Set([
  'true',
  'false',
  'null',
  'undefined',
  'NaN',
  'Infinity',
]);

// Whitespace is left uncolored, so it inherits from the element around it.
function colorOf(
  content: string,
  next: string | undefined,
): string | undefined {
  if (/^\s/.test(content)) return undefined;
  if (/^-?\d/.test(content)) return palette.number;
  if (/^['"]/.test(content)) return palette.string;
  if (content === ',' || content === ';' || content === ':')
    return palette.separator;
  if (CONSTANTS.has(content)) return palette.constant;

  // What follows an identifier is what it is: a parenthesis makes it the
  // function being called, a colon makes it a parameter being bound, and
  // neither makes it a value passed by name.
  if (/^[A-Za-z_$]/.test(content)) {
    if (next === '(') return palette.function;
    if (next === ':') return palette.parameter;

    return palette.variable;
  }

  return palette.punctuation;
}

export function highlightSignature(signature: string): CodeLine {
  const contents = signature.match(TOKEN_PATTERN) ?? [];

  return contents.map((content, index) => ({
    content,
    color: colorOf(content, contents[index + 1]),
  }));
}

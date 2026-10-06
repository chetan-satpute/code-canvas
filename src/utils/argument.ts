// What a typed argument has to look like to be accepted. Declared on the
// argument in the catalog, and read from there by both the form and the
// engine, so the two cannot disagree about what is valid.
export type ArgumentKind = 'number' | 'integer';

interface CheckableArgument {
  name: string;
  kind?: ArgumentKind;
}

// Plain decimal notation only. `Number()` alone would also take `0x2A`,
// `0b11` and `1e300`, none of which a reader means by a value.
const PATTERNS: Record<ArgumentKind, RegExp> = {
  number: /^-?\d+(\.\d+)?$/,
  integer: /^-?\d+$/,
};

// A value is drawn inside a 60px node at 15px monospace, which fits five
// characters. Measured on the number as drawn, so `007` counts as `7`.
const MAX_DRAWN_LENGTH = 5;

export function parseArgument(
  raw: string,
  kind: ArgumentKind = 'number',
): number | null {
  const text = raw.trim();
  if (!PATTERNS[kind].test(text)) return null;

  const value = Number(text);
  if (value.toString().length > MAX_DRAWN_LENGTH) return null;

  return value;
}

// The names of the arguments a submission cannot use, which is what the form
// marks. Whether a value is in range is not decided here: an index is checked
// against the structure's current length, which only the engine knows.
export function invalidArguments(
  args: CheckableArgument[],
  values: Record<string, string>,
): string[] {
  return args
    .filter((arg) => parseArgument(values[arg.name] ?? '', arg.kind) === null)
    .map((arg) => arg.name);
}

// Every argument parsed by its declared kind and keyed by name, or null if any
// of them cannot be used.
export function parseArguments(
  args: CheckableArgument[],
  values: Record<string, string>,
): Record<string, number> | null {
  const parsed: Record<string, number> = {};

  for (const arg of args) {
    const value = parseArgument(values[arg.name] ?? '', arg.kind);
    if (value === null) return null;

    parsed[arg.name] = value;
  }

  return parsed;
}

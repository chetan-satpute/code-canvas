import type { CodeAnchors } from '#utils/code.ts';

import type { AlgorithmRun } from '../algorithm.ts';

// One step of a run, in the terms a test asserts on: the listing line by its
// anchor name rather than its number, so editing the listing does not break
// the test, and the innermost call's memory as a plain object.
export interface TraceStep<State> {
  anchor: string;
  memory: Record<string, string>;
  depth: number;
  state: State;
}

// Plays a run to the end. `capture` is called at every step while the
// generator is paused there, so it reads the structure exactly as the reader
// is shown it at that step.
export function traceRun<State>(
  run: AlgorithmRun,
  anchors: CodeAnchors,
  capture: () => State,
): TraceStep<State>[] {
  // One name per line, since the highlight plugin refuses a second marker on
  // a line.
  const names = new Map(
    Object.entries(anchors).map(([name, line]) => [line, name]),
  );

  const trace: TraceStep<State>[] = [];

  // The last step is the generator's return value, not a yield, so it is
  // recorded when `done` is true as well.
  for (;;) {
    const { value: step, done } = run.next();
    const [innermost] = step.callStack;

    trace.push({
      anchor: names.get(step.line)!,
      memory: Object.fromEntries(innermost?.memory ?? []),
      depth: step.callStack.length,
      state: capture(),
    });

    if (done) return trace;
  }
}

import type { CanvasFrame } from '#canvas/frame.ts';

import type { CallStackEntry } from './call.ts';

// One point in a run that the reader is shown.
export interface CoreStep {
  // The listing line the run is on, 1-based like the code card's gutter.
  line: number;

  // A film strip, played one frame per animation frame. Always at least one.
  frames: CanvasFrame[];

  // Innermost call first, the order the call stack card lists them in.
  callStack: CallStackEntry[];
}

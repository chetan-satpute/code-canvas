import type { CodeAnchors } from '#utils/code.ts';

import type { CoreBoard } from './board.ts';
import { CoreCall, type CoreVariable } from './call.ts';
import type { CoreStep } from './step.ts';

// One run of an algorithm: the calls in progress and the steps shown so far.
// The call stack lives here rather than on the board, so a run that ends or
// is abandoned leaves nothing on the board to clear: the run is dropped.
export class CoreRun {
  private readonly board: CoreBoard;
  private readonly anchors: CodeAnchors;
  private readonly callStack: CoreCall[];

  constructor(board: CoreBoard, anchors: CodeAnchors) {
    this.board = board;
    this.anchors = anchors;
    this.callStack = [];
  }

  call(name: string, parameters: CoreVariable[]): CoreCall {
    const call = new CoreCall(name, parameters);
    this.callStack.push(call);

    return call;
  }

  // The innermost call's last step, on its closing brace, and then the pop.
  // The step is built first so the reader sees the call it is leaving.
  return(anchor: string): CoreStep {
    const step = this.step(anchor);
    this.callStack.pop();

    return step;
  }

  // The run as it stands, at a named line of the listing. Takes the frames
  // pushed since the last step, so any movement since then plays with it.
  step(anchor: string): CoreStep {
    const line = this.anchors[anchor];

    // Reachable only if an algorithm and its listing disagree, which would
    // otherwise highlight a plausible-looking wrong line.
    if (line === undefined)
      throw new Error(`The listing has no line named '${anchor}'`);

    return {
      line,
      frames: this.board.drainFrames(),
      callStack: this.callStack.map((call) => call.serialize()).reverse(),
    };
  }
}

import { type CanvasFrame, createCanvasFrame } from '#canvas/frame.ts';

import type { CoreStructure } from './structure.ts';

// Everything on the canvas, and the frames drawn since the reader was last
// shown anything.
export class CoreBoard {
  structures: CoreStructure[];

  // Frames pushed since the last drain. Empty most of the time: it fills only
  // while a tween is being written out.
  private pending: CanvasFrame[];

  constructor() {
    this.structures = [];
    this.pending = [];
  }

  add(structure: CoreStructure) {
    if (this.structures.includes(structure)) return;

    this.structures.push(structure);
  }

  remove(structure: CoreStructure) {
    const index = this.structures.indexOf(structure);
    if (index === -1) return;

    this.structures.splice(index, 1);
  }

  toFrame(): CanvasFrame {
    const frame = createCanvasFrame();

    for (const structure of this.structures) structure.serialize(frame);

    return frame;
  }

  // One tick of an animation. Call it after each small mutation; the frames
  // pile up until the next drain, and are played back in order.
  pushFrame() {
    this.pending.push(this.toFrame());
  }

  // Takes the frames drawn since the last drain, leaving none behind. A change
  // that pushed nothing, such as an instant reorder, still has to be shown, so
  // one frame of the board stands in.
  drainFrames(): CanvasFrame[] {
    if (this.pending.length === 0) this.pushFrame();

    const frames = this.pending;
    this.pending = [];

    return frames;
  }
}

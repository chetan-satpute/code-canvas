import { type CanvasFrame, createCanvasFrame } from '#canvas/frame.ts';

import type { CoreNode } from './elements/node.ts';
import type { CoreStructure } from './structure.ts';

// Everything on the canvas, and the frames drawn since the reader was last
// shown anything.
export class CoreBoard {
  structures: CoreStructure[];

  // Values in flight that belong to no structure, drawn over everything.
  private floating: CoreNode[];

  // Frames pushed since the last drain. Empty most of the time: it fills only
  // while a tween is being written out.
  private pending: CanvasFrame[];

  constructor() {
    this.structures = [];
    this.floating = [];
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

  float(node: CoreNode) {
    if (this.floating.includes(node)) return;

    this.floating.push(node);
  }

  unfloat(node: CoreNode) {
    const index = this.floating.indexOf(node);
    if (index === -1) return;

    this.floating.splice(index, 1);
  }

  // Captures which structures are on the board and what each holds, and
  // returns the undo. Stopping a run midway calls it, so an abandoned run
  // leaves nothing behind. Membership is captured as well as contents because
  // an algorithm may add structures of its own, and placement as well because
  // a tween may move or fade a whole structure, which `toData` does not hold.
  snapshot(): () => void {
    const saved = this.structures.map((structure) => ({
      structure,
      data: structure.toData(),
      x: structure.x,
      y: structure.y,
      opacity: structure.opacity,
      name: structure.name,
    }));

    return () => {
      this.structures = saved.map(({ structure }) => structure);

      // Placed before `restore`, which lays the contents out from `x/y`.
      for (const { structure, data, x, y, opacity, name } of saved) {
        structure.x = x;
        structure.y = y;
        structure.opacity = opacity;
        structure.name = name;
        structure.restore(data);
      }

      // A run whose generator throws can leave a value in flight, and frames
      // pushed by the undone work show a board that no longer exists.
      this.floating = [];
      this.pending = [];
    };
  }

  toFrame(): CanvasFrame {
    const frame = createCanvasFrame();

    for (const structure of this.structures) structure.serialize(frame);

    // A floating node's labels, if it had any, would join the frame's labels.
    for (const node of this.floating)
      node.serialize({ ...frame, nodes: frame.floating });

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

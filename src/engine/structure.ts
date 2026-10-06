import { NODE_HEIGHT, NODE_WIDTH } from '#canvas/elements/node.ts';
import { type CanvasFrame, createCanvasFrame } from '#canvas/frame.ts';

// A data structure on the board. `Data` is the plain form it converts to and
// from: the shape a structure operation edits, and what a run will restore.
export abstract class CoreStructure<Data = unknown> {
  // Top-left of the structure's first node. Everything it owns is laid out
  // relative to this by `rearrange`, so moving the whole structure is two
  // assignments.
  x: number;
  y: number;

  opacity: number;

  // The name the listings use for the structure, drawn one cell to the left
  // of `x/y`. Only the text is stored: its position is taken from the
  // structure when it serializes, the way a node's labels are.
  name?: string;

  constructor() {
    // One cell in, so the name to the left and the labels above the first
    // node keep the frame's coordinates at 0 or more.
    this.x = NODE_WIDTH;
    this.y = NODE_HEIGHT;

    this.opacity = 1;
  }

  abstract toData(): Data;

  // Replaces the structure's contents in place, so references to it stay
  // valid: the board keeps pointing at the same object.
  abstract restore(data: Data): void;

  // Recomputes the positions of everything the structure owns from its own.
  abstract rearrange(): void;

  // Writes the structure's own elements into the frame. The name is the base
  // class's, and is written after them.
  protected abstract serializeContents(frame: CanvasFrame): void;

  serialize(frame: CanvasFrame) {
    this.serializeContents(frame);

    if (this.name === undefined) return;

    frame.labels.push({
      x: this.x - NODE_WIDTH,
      y: this.y,
      text: this.name,
      opacity: this.opacity,
    });
  }

  toCanvasFrame(): CanvasFrame {
    const frame = createCanvasFrame();
    this.serialize(frame);

    return frame;
  }
}

import { NODE_WIDTH } from '#canvas/elements/node.ts';
import type { CanvasFrame } from '#canvas/frame.ts';

import { CoreCursors } from '../../cursors.ts';
import { CoreNode } from '../../elements/node.ts';
import { CoreStructure } from '../../structure.ts';

// Cells sit flush against each other, with no gap, because an array's
// defining property is that its elements are contiguous.
export class CoreArray extends CoreStructure<number[]> {
  nodes: CoreNode[];

  // Index variables of the listing, drawn under the cell they index.
  private cursors: CoreCursors;

  constructor(values: number[] = []) {
    super();

    this.nodes = [];
    this.cursors = new CoreCursors();
    this.restore(values);
  }

  toData(): number[] {
    return this.nodes.map((node) => node.value);
  }

  restore(values: number[]) {
    this.nodes = values.map((value) => new CoreNode(value));
    this.cursors.clear();
    this.rearrange();
  }

  setCursor(name: string, index: number) {
    this.cursors.set(name, index);
  }

  clearCursor(name: string) {
    this.cursors.delete(name);
  }

  rearrange() {
    this.nodes.forEach((node, index) => {
      node.x = this.x + index * NODE_WIDTH;
      node.y = this.y;

      // Indices are a property of the array, not of the node, so they are
      // rewritten on every layout: an element that shifts takes its new
      // index, not the one it was created with.
      node.setLabel('top', index.toString());
    });
  }

  protected serializeContents(frame: CanvasFrame) {
    for (const node of this.nodes) node.serialize(frame);

    // Past the last cell too, where the cell would be.
    this.cursors.serialize(frame, (index) => ({
      x: this.x + index * NODE_WIDTH,
      y: this.y,
      opacity: this.opacity,
    }));
  }
}

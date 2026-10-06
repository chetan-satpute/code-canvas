import { NODE_WIDTH } from '#canvas/elements/node.ts';
import type { CanvasFrame } from '#canvas/frame.ts';

import { CoreNode } from '../../elements/node.ts';
import { CoreStructure } from '../../structure.ts';

// Cells sit flush against each other, with no gap, because an array's
// defining property is that its elements are contiguous.
export class CoreArray extends CoreStructure<number[]> {
  nodes: CoreNode[];

  constructor(values: number[] = []) {
    super();

    this.nodes = [];
    this.restore(values);
  }

  toData(): number[] {
    return this.nodes.map((node) => node.value);
  }

  restore(values: number[]) {
    this.nodes = values.map((value) => new CoreNode(value));
    this.rearrange();
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
  }
}

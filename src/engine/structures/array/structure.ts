import { NODE_HEIGHT, NODE_WIDTH } from '#canvas/elements/node.ts';
import type { CanvasFrame } from '#canvas/frame.ts';

import { CoreNode } from '../../elements/node.ts';
import { CoreStructure } from '../../structure.ts';

// Cells sit flush against each other, with no gap, because an array's
// defining property is that its elements are contiguous.
export class CoreArray extends CoreStructure<number[]> {
  nodes: CoreNode[];

  // Index variables of the listing, by name, drawn under the cell they index.
  // Held as indices rather than on the nodes, because an index can point
  // past the last cell: `i === array.length` ends a loop.
  private cursors: Map<string, number>;

  constructor(values: number[] = []) {
    super();

    this.nodes = [];
    this.cursors = new Map();
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

    // Cursors on the same cell share one label (`i j`) rather than drawing
    // over each other.
    const names = new Map<number, string[]>();

    for (const [name, index] of this.cursors)
      names.set(index, [...(names.get(index) ?? []), name]);

    for (const [index, onCell] of names) {
      frame.labels.push({
        x: this.x + index * NODE_WIDTH,
        y: this.y + NODE_HEIGHT,
        text: onCell.join(' '),
        opacity: this.opacity,
      });
    }
  }
}

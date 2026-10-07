import { NODE_HEIGHT, NODE_WIDTH } from '#canvas/elements/node.ts';
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

  // The nodes by slot, under the name the max heap's row uses, so a swap
  // animates the same way in both (`animateSwap`).
  get cells(): CoreNode[] {
    return this.nodes;
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

  slot(index: number): { x: number; y: number } {
    return { x: this.x + index * NODE_WIDTH, y: this.y };
  }

  // `[array[a], array[b]] = [array[b], array[a]]`. The cells change slots and
  // are left where they stand, so a run can animate them there first.
  swap(a: number, b: number) {
    [this.nodes[a], this.nodes[b]] = [this.nodes[b], this.nodes[a]];
  }

  rearrange() {
    this.nodes.forEach((node, index) => Object.assign(node, this.slot(index)));
  }

  // A cell away from its slot is mid-swap, passing under the row through the
  // cursors' row, so its slot's index and cursors are left out until it
  // lands. Past either end there is no cell to be away.
  private away(index: number): boolean {
    const node = this.nodes[index];
    if (node === undefined) return false;

    const { x, y } = this.slot(index);

    return node.x !== x || node.y !== y;
  }

  protected serializeContents(frame: CanvasFrame) {
    // Indices belong to the slot, not to the value in it, so they are drawn
    // at the slot rather than carried by the node.
    this.nodes.forEach((node, index) => {
      node.serialize(frame);
      if (this.away(index)) return;

      frame.labels.push({
        x: node.x,
        y: node.y - NODE_HEIGHT,
        text: index.toString(),
        opacity: node.opacity,
      });
    });

    // One slot beyond either end too, where a cell would be: a search's bound
    // can step to -1 or to `length`. An index further out than that, such as
    // one an algorithm is about to reject as out of range, stands under no
    // slot, and is read in memory instead.
    this.cursors.serialize(frame, (index) =>
      index < -1 || index > this.nodes.length || this.away(index)
        ? null
        : { ...this.slot(index), opacity: this.opacity },
    );
  }
}

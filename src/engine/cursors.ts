import { NODE_HEIGHT } from '#canvas/elements/node.ts';
import type { CanvasFrame } from '#canvas/frame.ts';

// Where a cell is drawn, and how visibly. Null for a cell with nothing to
// name, so its cursors are left out.
export type CursorCell = { x: number; y: number; opacity: number } | null;

// A listing's index variables, by name, each drawn under the cell it indexes.
// Held as indices rather than on the nodes, because an index names a slot, not
// the value in it: a value can leave the slot while the variable stays, and an
// index can point past the last cell (`i === array.length` ends a loop). For
// the structures whose algorithms index into an array: the array and the max
// heap.
export class CoreCursors {
  private held: Map<string, number>;

  constructor() {
    this.held = new Map();
  }

  set(name: string, index: number) {
    this.held.set(name, index);
  }

  delete(name: string) {
    this.held.delete(name);
  }

  clear() {
    this.held.clear();
  }

  // Derived from the cell when serializing, so nothing has to re-pin a label.
  // Cursors on the same cell share one label (`i j`) rather than drawing over
  // each other.
  serialize(frame: CanvasFrame, cell: (index: number) => CursorCell) {
    const names = new Map<number, string[]>();

    for (const [name, index] of this.held)
      names.set(index, [...(names.get(index) ?? []), name]);

    for (const [index, onCell] of names) {
      const at = cell(index);
      if (at === null) continue;

      frame.labels.push({
        x: at.x,
        y: at.y + NODE_HEIGHT,
        text: onCell.join(' '),
        opacity: at.opacity,
      });
    }
  }
}

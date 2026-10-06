import {
  NODE_HEIGHT,
  NODE_WIDTH,
  type NodeVariant,
} from '#canvas/elements/node.ts';
import type { CanvasFrame } from '#canvas/frame.ts';

import { CoreCursors, type CursorCell } from '../../cursors.ts';
import { CoreEdge } from '../../elements/edge.ts';
import { CoreNode } from '../../elements/node.ts';
import { CoreStructure } from '../../structure.ts';

// From the array row to the tree's root. The two rows under the array are the
// lanes a swapping cell travels in, the first also holding the cursors, and
// one more keeps the far lane off the root.
export const TREE_OFFSET = 4 * NODE_HEIGHT;

// From one level of the tree to the next. The row between is left to the
// links.
export const LEVEL_SPACING = 2 * NODE_HEIGHT;

export function parentOf(index: number): number {
  return Math.floor((index - 1) / 2);
}

export interface Position {
  x: number;
  y: number;
}

// An array kept in heap order, drawn twice: as the array the listings index,
// and below it as the complete binary tree that array represents, where the
// children of slot `i` are slots `2i + 1` and `2i + 2`. Slot `i` is
// `cells[i]` in the row and `nodes[i]` in the tree.
export class CoreMaxHeap extends CoreStructure<number[]> {
  cells: CoreNode[];
  nodes: CoreNode[];

  // The link into each slot's tree node from its parent's. None into the root.
  links: (CoreEdge | null)[];

  // Index variables of the listing, drawn under the array cell they index.
  // Only there: an index names an array slot, and the row under a tree node
  // is where its links leave, which a label as long as `parent` would clip.
  private cursors: CoreCursors;

  constructor(values: number[] = []) {
    super();

    this.cells = [];
    this.nodes = [];
    this.links = [];
    this.cursors = new CoreCursors();
    this.restore(values);
  }

  toData(): number[] {
    return this.cells.map((cell) => cell.value);
  }

  // Taken in the order given, which must already be heap order: the plain
  // form is the array itself, and a run restores it exactly.
  restore(values: number[]) {
    this.cells = [];
    this.nodes = [];
    this.links = [];
    this.cursors.clear();

    for (const value of values) this.append(value);

    this.rearrange();
  }

  // `heap.push(value)`: a new last slot, which is a leaf of the tree. Not
  // laid out, so a run can open the tree's column for it first.
  append(value: number) {
    const index = this.cells.length;
    const node = new CoreNode(value);

    this.cells.push(new CoreNode(value));
    this.nodes.push(node);
    this.links.push(
      index === 0 ? null : new CoreEdge(this.nodes[parentOf(index)], node),
    );
  }

  // `[heap[a], heap[b]] = [heap[b], heap[a]]`. The cells change slots, since
  // nothing is attached to them. The tree's two nodes are held in place by
  // their links, so they trade their values where they stand instead: moving
  // them would drag every link out of shape, which reads as the tree coming
  // apart rather than as two values swapping.
  swap(a: number, b: number) {
    [this.cells[a], this.cells[b]] = [this.cells[b], this.cells[a]];

    const [first, second] = [this.nodes[a], this.nodes[b]];

    [first.value, second.value] = [second.value, first.value];
    [first.variant, second.variant] = [second.variant, first.variant];
  }

  // Colors a slot in both views, which keeps them telling the same story.
  setVariant(index: number, variant: NodeVariant) {
    this.cells[index].variant = variant;
    this.nodes[index].variant = variant;
  }

  resetVariants() {
    for (let index = 0; index < this.cells.length; index++)
      this.setVariant(index, 'primary');
  }

  setCursor(name: string, index: number) {
    this.cursors.set(name, index);
  }

  clearCursor(name: string) {
    this.cursors.delete(name);
  }

  slot(index: number): Position {
    return { x: this.x + index * NODE_WIDTH, y: this.y };
  }

  // Where each tree node belongs, by slot, worked out without moving any. The
  // same layout as the binary search tree's: each node takes the next column
  // in order and its depth decides the row, which gives every node a column
  // of its own and draws no crossing links.
  treeLayout(): Position[] {
    const positions: Position[] = [];
    let column = 0;

    const walk = (index: number, depth: number) => {
      if (index >= this.nodes.length) return;

      walk(2 * index + 1, depth + 1);

      positions[index] = {
        x: this.x + column * NODE_WIDTH,
        y: this.y + TREE_OFFSET + depth * LEVEL_SPACING,
      };
      column++;

      walk(2 * index + 2, depth + 1);
    };

    walk(0, 0);

    return positions;
  }

  rearrange() {
    this.cells.forEach((cell, index) => Object.assign(cell, this.slot(index)));

    const layout = this.treeLayout();
    this.nodes.forEach((node, index) => Object.assign(node, layout[index]));
  }

  // A slot's index and cursors belong to the slot, not to the value in it, so
  // they are drawn at the slot and left out while its cell is away from it.
  // A cell leaving its slot passes through the rows they are drawn in.
  private home(index: number): CursorCell {
    const cell = this.cells[index];
    if (cell === undefined) return null;

    const { x, y } = this.slot(index);
    if (cell.x !== x || cell.y !== y) return null;

    return { x, y, opacity: cell.opacity };
  }

  protected serializeContents(frame: CanvasFrame) {
    for (const cell of this.cells) cell.serialize(frame);
    for (const node of this.nodes) node.serialize(frame);
    for (const link of this.links) link?.serialize(frame);

    for (let index = 0; index < this.cells.length; index++) {
      const at = this.home(index);
      if (at === null) continue;

      frame.labels.push({
        x: at.x,
        y: at.y - NODE_HEIGHT,
        text: index.toString(),
        opacity: at.opacity,
      });
    }

    this.cursors.serialize(frame, (index) => this.home(index));
  }
}

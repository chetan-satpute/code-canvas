import { NODE_HEIGHT } from '#canvas/elements/node.ts';
import type { CanvasFrame } from '#canvas/frame.ts';

import type { CoreNode } from './elements/node.ts';

// How the names of pointers on one node are drawn. `join` writes them on one
// label (`previous current`). `stack` writes each on a line of its own, one
// under another, as a block under the node.
export type PointerSharing = 'join' | 'stack';

// From one stacked name to the next: about one line of label text, so the
// names read as one block rather than as labels of separate cells.
const STACK_LINE = NODE_HEIGHT / 2;

// A listing's node variables, by name, each drawn under the node it holds.
// For the structures whose algorithms hold nodes by reference rather than by
// index: a linked list and a binary search tree.
export class CorePointers<N extends CoreNode> {
  private held: Map<string, N>;

  private readonly sharing: PointerSharing;

  constructor(sharing: PointerSharing = 'join') {
    this.held = new Map();
    this.sharing = sharing;
  }

  // Kept in the order each pointer arrived at its node, so a name already on
  // a node keeps its place when another joins it.
  set(name: string, node: N) {
    if (this.held.get(name) === node) return;

    this.held.delete(name);
    this.held.set(name, node);
  }

  delete(name: string) {
    this.held.delete(name);
  }

  clear() {
    this.held.clear();
  }

  nodes(): IterableIterator<N> {
    return this.held.values();
  }

  // Derived from the node they name when serializing, like a node's own
  // labels, so they follow it through a move or a fade with no bookkeeping.
  // Pointers on the same node share it rather than drawing over each other.
  serialize(frame: CanvasFrame) {
    const names = new Map<N, string[]>();

    for (const [name, node] of this.held)
      names.set(node, [...(names.get(node) ?? []), name]);

    for (const [node, onNode] of names) {
      const lines = this.sharing === 'join' ? [onNode.join(' ')] : onNode;

      lines.forEach((text, line) => {
        frame.labels.push({
          x: node.x,
          y: node.y + NODE_HEIGHT + line * STACK_LINE,
          text,
          opacity: node.opacity,
        });
      });
    }
  }
}

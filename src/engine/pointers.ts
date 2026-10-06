import { NODE_HEIGHT } from '#canvas/elements/node.ts';
import type { CanvasFrame } from '#canvas/frame.ts';

import type { CoreNode } from './elements/node.ts';

// A listing's node variables, by name, each drawn under the node it holds.
// For the structures whose algorithms hold nodes by reference rather than by
// index: a linked list and a binary search tree.
export class CorePointers<N extends CoreNode> {
  private held: Map<string, N>;

  constructor() {
    this.held = new Map();
  }

  set(name: string, node: N) {
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
  // Pointers on the same node share one label (`previous current`) rather
  // than drawing over each other.
  serialize(frame: CanvasFrame) {
    const names = new Map<N, string[]>();

    for (const [name, node] of this.held)
      names.set(node, [...(names.get(node) ?? []), name]);

    for (const [node, onNode] of names) {
      frame.labels.push({
        x: node.x,
        y: node.y + NODE_HEIGHT,
        text: onNode.join(' '),
        opacity: node.opacity,
      });
    }
  }
}

import { NODE_HEIGHT, NODE_WIDTH } from '#canvas/elements/node.ts';
import type { CanvasFrame } from '#canvas/frame.ts';

import { CoreEdge } from '../../elements/edge.ts';
import { CoreNode } from '../../elements/node.ts';
import { CorePointers } from '../../pointers.ts';
import { CoreStructure } from '../../structure.ts';

// From one level to the next. The row between is left to the links, and to
// the pointer under a node.
export const LEVEL_SPACING = 2 * NODE_HEIGHT;

export type Side = 'left' | 'right';

// An edge holds both of its nodes, so a link is the edge itself rather than a
// reference to the child.
export type Link = CoreEdge<CoreBinarySearchTreeNode> | null;

export class CoreBinarySearchTreeNode extends CoreNode {
  left: Link;
  right: Link;

  constructor(value: number) {
    super(value);

    this.left = null;
    this.right = null;
  }

  child(side: Side): CoreBinarySearchTreeNode | null {
    return this[side]?.end ?? null;
  }

  // A new edge every time, since an edge is drawn from the node it starts at.
  setChild(side: Side, node: CoreBinarySearchTreeNode | null) {
    this[side] = node === null ? null : new CoreEdge(this, node);
  }

  serialize(frame: CanvasFrame) {
    super.serialize(frame);

    // Written by the node they leave, so a walk that visits every node writes
    // every link exactly once.
    this.left?.serialize(frame);
    this.right?.serialize(frame);
  }
}

export class CoreBinarySearchTree extends CoreStructure<number[]> {
  root: CoreBinarySearchTreeNode | null;

  // A node a pointer holds is drawn even when the tree cannot reach it, such
  // as one just unlinked: the canvas shows what the code can reach.
  private pointers: CorePointers<CoreBinarySearchTreeNode>;

  constructor(values: number[] = []) {
    super();

    this.root = null;
    this.pointers = new CorePointers();
    this.restore(values);
  }

  // Parents before their children, so inserting the values back in this order
  // rebuilds the same shape. `restore` relies on that.
  toData(): number[] {
    return this.preorder().map((node) => node.value);
  }

  // Shaped by the order of `values`, the way a tree built by inserting them
  // one at a time would be. A repeated value is skipped.
  restore(values: number[]) {
    this.root = null;
    this.pointers.clear();

    for (const value of values) this.insert(value);

    this.rearrange();
  }

  preorder(): CoreBinarySearchTreeNode[] {
    const nodes: CoreBinarySearchTreeNode[] = [];

    const walk = (node: CoreBinarySearchTreeNode | null) => {
      if (node === null) return;

      nodes.push(node);
      walk(node.child('left'));
      walk(node.child('right'));
    };

    walk(this.root);

    return nodes;
  }

  // Smallest value first, which is also the column order of the layout.
  inorder(): CoreBinarySearchTreeNode[] {
    const nodes: CoreBinarySearchTreeNode[] = [];

    const walk = (node: CoreBinarySearchTreeNode | null) => {
      if (node === null) return;

      walk(node.child('left'));
      nodes.push(node);
      walk(node.child('right'));
    };

    walk(this.root);

    return nodes;
  }

  // Links a new node into the one place the ordering leaves for it, without
  // laying it out. A binary search tree holds no duplicates, so a value it
  // already has inserts nothing.
  insert(value: number) {
    if (this.root === null) {
      this.root = new CoreBinarySearchTreeNode(value);
      return;
    }

    let parent = this.root;

    while (value !== parent.value) {
      const side = value < parent.value ? 'left' : 'right';
      const child = parent.child(side);

      if (child === null) {
        parent.setChild(side, new CoreBinarySearchTreeNode(value));
        return;
      }

      parent = child;
    }
  }

  setPointer(name: string, node: CoreBinarySearchTreeNode) {
    this.pointers.set(name, node);
  }

  clearPointer(name: string) {
    this.pointers.delete(name);
  }

  // Each node takes the next column in order, and its depth decides the row.
  // That gives every node a column of its own and draws no crossing links
  // without measuring a subtree. Two nodes on one level always have an
  // ancestor between them in order, so the cells beside a node are empty too.
  // Places only the nodes the tree reaches. One held by a pointer alone stays
  // wherever the algorithm put it.
  rearrange() {
    let column = 0;

    const walk = (node: CoreBinarySearchTreeNode | null, depth: number) => {
      if (node === null) return;

      walk(node.child('left'), depth + 1);

      node.x = this.x + column * NODE_WIDTH;
      node.y = this.y + depth * LEVEL_SPACING;
      column++;

      walk(node.child('right'), depth + 1);
    };

    walk(this.root, 0);
  }

  protected serializeContents(frame: CanvasFrame) {
    // An unlinked node may still link back into the tree, so a node already
    // drawn ends that walk rather than drawing a subtree twice.
    const drawn = new Set<CoreBinarySearchTreeNode>();

    const draw = (node: CoreBinarySearchTreeNode | null) => {
      if (node === null || drawn.has(node)) return;

      drawn.add(node);
      node.serialize(frame);
      draw(node.child('left'));
      draw(node.child('right'));
    };

    draw(this.root);
    for (const node of this.pointers.nodes()) draw(node);

    // Derived from the root node when serializing, like the pointers, so it
    // follows the node through a move or a fade.
    if (this.root !== null) {
      frame.labels.push({
        x: this.root.x,
        y: this.root.y - NODE_HEIGHT,
        text: 'root',
        opacity: this.root.opacity,
      });
    }

    this.pointers.serialize(frame);
  }
}

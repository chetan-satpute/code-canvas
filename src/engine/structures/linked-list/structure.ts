import { NODE_HEIGHT, NODE_WIDTH } from '#canvas/elements/node.ts';
import type { CanvasFrame } from '#canvas/frame.ts';

import { CoreEdge } from '../../elements/edge.ts';
import { CoreNode } from '../../elements/node.ts';
import { CorePointers } from '../../pointers.ts';
import { CoreStructure } from '../../structure.ts';

// From one node to the next. Unlike the array's flush row there is a node's
// width of gap: what makes a list a list is the link from one node to the
// next, and the gap is the room that link is drawn in.
export const LINK_SPACING = 2 * NODE_WIDTH;

// An edge holds both of its nodes, so a link is the edge itself rather than a
// reference to the successor.
export type Link = CoreEdge<CoreLinkedListNode> | null;

export class CoreLinkedListNode extends CoreNode {
  next: Link;

  constructor(value: number) {
    super(value);

    this.next = null;
  }

  get successor(): CoreLinkedListNode | null {
    return this.next?.end ?? null;
  }

  // A new edge every time, since an edge is drawn from the node it starts at.
  setNext(node: CoreLinkedListNode | null) {
    this.next = node === null ? null : new CoreEdge(this, node);
  }

  serialize(frame: CanvasFrame) {
    super.serialize(frame);

    // Written by the node it leaves, so a walk that visits every node writes
    // every link exactly once.
    this.next?.serialize(frame);
  }
}

export class CoreLinkedList extends CoreStructure<number[]> {
  head: CoreLinkedListNode | null;

  // A node a pointer holds is drawn even when the list cannot reach it, such
  // as one just created and not yet linked in: the canvas shows what the code
  // can reach.
  private pointers: CorePointers<CoreLinkedListNode>;

  constructor(values: number[] = []) {
    super();

    this.head = null;
    this.pointers = new CorePointers();
    this.restore(values);
  }

  toData(): number[] {
    return this.nodes().map((node) => node.value);
  }

  restore(values: number[]) {
    this.head = null;
    this.pointers.clear();

    let previous: CoreLinkedListNode | null = null;

    for (const value of values) {
      const node = new CoreLinkedListNode(value);

      if (previous === null) this.head = node;
      else previous.setNext(node);

      previous = node;
    }

    this.rearrange();
  }

  // Every node the list reaches, head first. Following `next` is the only way
  // to reach them, which is the property the algorithms are about.
  nodes(): CoreLinkedListNode[] {
    const nodes: CoreLinkedListNode[] = [];

    for (let node = this.head; node !== null; node = node.successor)
      nodes.push(node);

    return nodes;
  }

  // First match, the one a scan from the head would stop at.
  find(value: number): CoreLinkedListNode | undefined {
    return this.nodes().find((node) => node.value === value);
  }

  setPointer(name: string, node: CoreLinkedListNode) {
    this.pointers.set(name, node);
  }

  clearPointer(name: string) {
    this.pointers.delete(name);
  }

  // Places only the nodes the list reaches. One held by a pointer alone stays
  // wherever the algorithm put it.
  rearrange() {
    this.nodes().forEach((node, index) => {
      node.x = this.x + index * LINK_SPACING;
      node.y = this.y;
    });
  }

  protected serializeContents(frame: CanvasFrame) {
    // A pointer's node may lead back into the list, so a node already drawn
    // ends that walk rather than drawing the rest of the list twice.
    const drawn = new Set<CoreLinkedListNode>();

    const draw = (from: CoreLinkedListNode | null) => {
      let node = from;

      while (node !== null && !drawn.has(node)) {
        drawn.add(node);
        node.serialize(frame);
        node = node.successor;
      }
    };

    draw(this.head);
    for (const node of this.pointers.nodes()) draw(node);

    // Derived from the head node when serializing, like the pointers, so it
    // follows the node through a move or a fade.
    if (this.head !== null) {
      frame.labels.push({
        x: this.head.x,
        y: this.head.y - NODE_HEIGHT,
        text: 'head',
        opacity: this.head.opacity,
      });
    }

    this.pointers.serialize(frame);
  }
}

import {
  NODE_HEIGHT,
  NODE_WIDTH,
  type NodeVariant,
} from '#canvas/elements/node.ts';
import type { CanvasFrame } from '#canvas/frame.ts';

export type NodeLabelPosition = 'top' | 'right' | 'bottom' | 'left';

// A label sits one node-cell away in its direction. A label's cell is
// node-sized, so it lines up with the node's column or row without anyone
// measuring text.
const LABEL_OFFSETS: Record<NodeLabelPosition, [number, number]> = {
  top: [0, -NODE_HEIGHT],
  right: [NODE_WIDTH, 0],
  bottom: [0, NODE_HEIGHT],
  left: [-NODE_WIDTH, 0],
};

// A value on the canvas. Its variant is how an algorithm says what it is
// doing to the value.
export class CoreNode {
  x: number;
  y: number;

  value: number;
  variant: NodeVariant;
  opacity: number;

  // A slot an algorithm has made but not yet written (`array.length += 1`).
  // It is drawn with no value, and `value` means nothing until it is written.
  empty: boolean;

  // Annotations that travel with the value rather than with a slot, which an
  // array's index and cursors belong to. Only the text is stored; position
  // and opacity are taken from the node when it serializes, so nothing has to
  // re-pin them after the node moves or fades.
  labels: Partial<Record<NodeLabelPosition, string>>;

  constructor(value: number) {
    this.x = 0;
    this.y = 0;

    this.value = value;
    this.variant = 'primary';
    this.opacity = 1;
    this.empty = false;

    this.labels = {};
  }

  setLabel(position: NodeLabelPosition, text?: string) {
    if (text === undefined) delete this.labels[position];
    else this.labels[position] = text;
  }

  clearLabels() {
    this.labels = {};
  }

  serialize(frame: CanvasFrame) {
    frame.nodes.push({
      x: this.x,
      y: this.y,
      value: this.value,
      variant: this.variant,
      opacity: this.opacity,
      ...(this.empty && { empty: true }),
    });

    for (const [position, text] of Object.entries(this.labels)) {
      const [dx, dy] = LABEL_OFFSETS[position as NodeLabelPosition];

      frame.labels.push({
        x: this.x + dx,
        y: this.y + dy,
        text,
        opacity: this.opacity,
      });
    }
  }
}

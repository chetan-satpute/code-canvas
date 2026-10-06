import type { CanvasFrame } from '#canvas/frame.ts';

// Free-standing text on the canvas, such as a structure's name. Positioned by
// whatever owns it. A node's own annotations are not these: the node derives
// them from its position, see `CoreNode.labels`.
export class CoreLabel {
  text: string;

  x: number;
  y: number;
  opacity: number;

  constructor(text: string) {
    this.text = text;

    this.x = 0;
    this.y = 0;
    this.opacity = 1;
  }

  serialize(frame: CanvasFrame) {
    frame.labels.push({
      x: this.x,
      y: this.y,
      text: this.text,
      opacity: this.opacity,
    });
  }
}

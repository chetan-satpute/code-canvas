import type { CanvasTheme } from '../theme.ts';
import { NODE_HEIGHT, NODE_WIDTH } from './node.ts';

// A label occupies a node-sized cell and centers its text in it, so a label
// placed above, below, or beside a node lines up with that node's column or
// row without the caller doing any measuring. Text wider than the cell simply
// overflows it, still centered.
export const LABEL_WIDTH = NODE_WIDTH;
export const LABEL_HEIGHT = NODE_HEIGHT;

// Smaller than the value inside a node, so a label reads as an annotation of
// the structure rather than part of it.
const LABEL_FONT_SIZE = NODE_HEIGHT * 0.45;

// An annotation on the structure — an index, a pointer name, a structure's
// own name.
export interface CanvasLabel {
  // Top-left of the label's cell, in the same coordinates a node is placed at.
  x: number;
  y: number;
  text: string;
  opacity: number;
}

export function drawCanvasLabel(
  ctx: CanvasRenderingContext2D,
  label: CanvasLabel,
  theme: CanvasTheme,
) {
  const { x, y, text, opacity } = label;

  ctx.save();
  ctx.globalAlpha = opacity;

  ctx.fillStyle = theme.label;
  ctx.font = `${LABEL_FONT_SIZE}px ${theme.font}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + LABEL_WIDTH / 2, y + LABEL_HEIGHT / 2);

  ctx.restore();
}
